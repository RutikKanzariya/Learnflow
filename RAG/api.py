from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import io
import json
import re
import os

from langchain_chroma import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from pypdf import PdfReader

from providers import (
    get_llm,
    get_embeddings,
    llm_text,
    strip_code_fences,
    build_chroma_collection_name,
    get_api_key,
)


# Load environment variables
load_dotenv()


# Allowed browser origins (comma-separated, e.g. frontend URLs)
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

# Directory where the ChromaDB vector store lives.
# Use an absolute path (e.g. a Render disk mount) in production.
CHROMA_DB_DIR = os.getenv("CHROMA_DB_DIR", "chroma-db")

COLLECTION_NAME = build_chroma_collection_name()


# Make sure the API key is present early so failures
# are loud and clear instead of a confusing 500.
get_api_key()


# -----------------------------
# FASTAPI APPLICATION
# -----------------------------

app = FastAPI(
    title="LearnFlow RAG API",
    description="RAG service for the LearnFlow learning platform",
    version="1.0.0",
)


# -----------------------------
# CORS
# -----------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


# -----------------------------
# RAG SETUP
#
# Everything here is created lazily (on first use) so that importing the
# app stays tiny. That stops the free-tier Render instance from running
# out of memory while uvicorn is still starting up.
# -----------------------------

_embedding_model = None
_vector_store = None


def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = get_embeddings()
    return _embedding_model


def get_vector_store():
    global _vector_store
    if _vector_store is None:
        _vector_store = Chroma(
            collection_name=COLLECTION_NAME,
            embedding_function=get_embedding_model(),
            persist_directory=CHROMA_DB_DIR,
        )
    return _vector_store


def _reset_vector_store():
    """Delete the collection and drop the cached store so the next access
    recreates it (used when an incompatible index - different vector
    dimensions, e.g. from a previous embedding provider - is detected).
    """
    global _vector_store

    vector_store = get_vector_store()

    try:
        vector_store._client.delete_collection(
            vector_store._collection.name
        )
    except Exception:
        pass

    _vector_store = None


def _index_documents(chunk_docs):
    """Add documents to the vector store.

    If the existing index uses different vector dimensions
    (old embedding provider), reset it once and retry.
    """
    try:
        get_vector_store().add_documents(chunk_docs)
    except Exception as error:
        message = str(error).lower()

        if "dimension" in message or "expected" in message:
            print("Vector store incompatible, resetting index.")
            _reset_vector_store()
            get_vector_store().add_documents(chunk_docs)
        else:
            raise


def _make_retriever():
    return get_vector_store().as_retriever(
        search_type="mmr",
        search_kwargs={
            "k": 4,
            "fetch_k": 10,
            "lambda_mult": 0.5,
        },
    )


llm = get_llm()


prompt = ChatPromptTemplate([
    (
        "system",
        """You are a helpful AI tutor for LearnFlow.

Use ONLY the provided context to answer the question.

If the answer is not present in the context, say:

"I could not find the answer in the document."

Always answer in plain text using markdown formatting for structure.
Never return JSON. Never wrap your answer in code fences (```).
Do not mention how you retrieved the answer.
"""
    ),
    (
        "human",
        """Context:
{context}

Question:
{question}
"""
    ),
])


# -----------------------------
# HELPERS
# -----------------------------

def _retrieve(question):
    """Safely retrieve context for a question."""
    try:
        docs = _make_retriever().invoke(question)
        return docs
    except Exception as error:
        print("Retrieval error:", str(error))
        return []


def _extract_json(raw_content):
    """Turn a model response into a Python object.

    Handles markdown code fences and leading/trailing prose.
    Raises ValueError if no valid JSON can be extracted.
    """
    if isinstance(raw_content, (dict, list)):
        return raw_content

    text = strip_code_fences(llm_text(raw_content))

    # Find the outermost JSON object or array.
    start_indexes = [i for i in (text.find("{"), text.find("[")) if i != -1]
    end_indexes = [i for i in (text.rfind("}"), text.rfind("]")) if i != -1]

    if not start_indexes or not end_indexes:
        raise ValueError("No JSON found in model response")

    start = min(start_indexes)
    end = max(end_indexes) + 1

    try:
        return json.loads(text[start:end])
    except json.JSONDecodeError:
        pass

    # Last attempt: try progressively shorter slices.
    for cut in range(start, end):
        for stop in range(end, cut, -1):
            try:
                return json.loads(text[cut:stop])
            except (json.JSONDecodeError, ValueError):
                continue

    raise ValueError("Invalid JSON in model response")


ROADMAP_KEYWORDS = (
    "roadmap",
    "learning path",
    "study plan",
    "how to learn",
    "how do i learn",
    "how should i learn",
    "learn ",
    "course for ",
    "learning plan",
)


def _is_roadmap_query(question):
    lowered = question.lower()

    if any(keyword in lowered for keyword in ROADMAP_KEYWORDS):
        # Avoid treating plain fact questions like
        # "what does this mean" as roadmaps.
        if any(
            word in lowered
            for word in (
                "roadmap",
                "learning path",
                "study plan",
                "learning plan",
            )
        ):
            return True

        if " how to learn " in f" {lowered} ":
            return True

        if lowered.startswith("learn "):
            return True

        if lowered.startswith("how do i learn"):
            return True

        if lowered.startswith("how should i learn"):
            return True

        # "how to learn X" / "how to learn X for beginners"
        if lowered.startswith("how to learn"):
            return True

    return False


def _make_roadmap(goal, content=""):
    """Generate a complete learning roadmap in plain text."""

    content = (content or "").strip()

    docs = []
    context = ""

    if content:
        context = content
    else:
        docs = _retrieve(f"Create a learning roadmap for {goal}")
        context = "\n\n".join(doc.page_content for doc in docs).strip()

    context_block = ""
    if context:
        context_block = f"""Use the following context when available to ground your roadmap.
Context:
{context}
"""

    roadmap_prompt = f"""You are an expert learning advisor and curriculum designer.

Create a COMPLETE, step-by-step learning roadmap to achieve this goal:

Goal: {goal}

{context_block}
Requirements:
- Start from absolute beginner level and progress step by step.
- Structure the roadmap as numbered phases (e.g. Phase 1, Phase 2, ...).
- For every phase include:
  * What to learn (topics/concepts)
  * Why it matters
  * Practical actions/resources (books, courses, exercises)
  * Recommended time to spend
  * A small practical mini-project or exercise
- Cover fundamentals first, then tools, then advanced concepts,
  then real-world projects and portfolio work.
- Finish with tips for staying consistent and next steps.

Rules:
- Respond in plain text using markdown headings, numbered lists
  and bullet points. Make it highly readable.
- NEVER return JSON. NEVER wrap the response in code fences (```).
"""

    response = llm.invoke(roadmap_prompt)

    roadmap = strip_code_fences(llm_text(response)).strip()

    if not roadmap:
        roadmap = f"Here is a suggested roadmap to achieve: {goal}.\n" \
                  "Start with the fundamentals, practice daily, " \
                  "and build small projects as you progress."

    return roadmap, len(docs)


# -----------------------------
# REQUEST MODELS
# -----------------------------

class QuestionRequest(BaseModel):
    question: str


class RoadmapRequest(BaseModel):
    goal: str
    content: str = ""


class QuizRequest(BaseModel):
    topic: str
    content: str = ""


class FlashcardRequest(BaseModel):
    topic: str
    content: str = ""


# -----------------------------
# HEALTH CHECK
# -----------------------------

@app.get("/")
def root():
    return {
        "message": "LearnFlow RAG API is running"
    }


# -----------------------------
# PDF UPLOAD
# -----------------------------

@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...)
):

    # Check file type
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported",
        )

    # Read file
    file_bytes = await file.read()

    # Check file size
    max_size = 10 * 1024 * 1024

    if len(file_bytes) > max_size:
        raise HTTPException(
            status_code=400,
            detail="PDF cannot exceed 10 MB",
        )

    try:

        # Read PDF
        pdf = PdfReader(
            io.BytesIO(file_bytes)
        )

        pages = []

        for page_number, page in enumerate(
            pdf.pages,
            start=1
        ):

            text = page.extract_text() or ""

            if text.strip():

                pages.append({
                    "page": page_number,
                    "text": text,
                })

        if not pages:
            raise HTTPException(
                status_code=400,
                detail="No readable text found in PDF",
            )

        full_text = "\n\n".join(
            page["text"]
            for page in pages
        )

        # Split into chunks
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
        )

        chunks = splitter.split_text(full_text)

        # Store chunks as LangChain documents
        chunk_docs = [
            Document(
                page_content=chunk,
                metadata={"source": file.filename},
            )
            for chunk in chunks
        ]

        # Index into the vector store
        _index_documents(chunk_docs)

        return {
            "filename": file.filename,
            "pages": len(pages),
            "characters": len(full_text),
            "chunks": len(chunk_docs),
            "message": "PDF uploaded and indexed successfully",
        }

    except HTTPException:
        raise

    except Exception as error:

        print(
            "PDF processing error:",
            str(error)
        )

        raise HTTPException(
            status_code=400,
            detail=f"Could not read PDF: {error}",
        )


# -----------------------------
# RAG QUESTION  (plain-text only)
# -----------------------------

@app.post("/ask")
def ask_question(
    request: QuestionRequest
):

    question = request.question.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question is required",
        )

    try:

        # The user is asking for a learning path /
        # course roadmap -> give a full roadmap.
        if _is_roadmap_query(question):
            roadmap, source_count = _make_roadmap(question)

            return {
                "question": question,
                "answer": roadmap,
                "sources": source_count,
                "type": "roadmap",
            }

        # Retrieve relevant documents
        docs = _retrieve(question)

        # Combine retrieved documents
        context = "\n\n".join(
            doc.page_content
            for doc in docs
        )

        # If no document has been uploaded,
        # answer using the LLM general knowledge.
        if not context.strip():
            fallback_prompt = f"""You are a helpful AI tutor for LearnFlow.

No document has been uploaded, so answer the question using your own general knowledge.

Give a clear and well formatted answer using plain text with markdown.
Never return JSON. Never wrap your answer in code fences (```).

Question:
{question}
"""

            response = llm.invoke(
                fallback_prompt
            )

            return {
                "question": question,
                "answer": strip_code_fences(
                    llm_text(response)
                ),
                "sources": len(docs),
                "type": "answer",
            }

        # Build prompt
        final_prompt = prompt.invoke(
            {
                "context": context,
                "question": question,
            }
        )

        # Generate answer
        response = llm.invoke(
            final_prompt
        )

        return {
            "question": question,
            "answer": strip_code_fences(
                llm_text(response)
            ),
            "sources": len(docs),
            "type": "answer",
        }

    except HTTPException:
        raise

    except Exception as error:

        print(
            "RAG error:",
            str(error)
        )

        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate answer: {error}",
        )


# -----------------------------
# LEARNING ROADMAP
# -----------------------------

@app.post("/roadmap")
def generate_roadmap(
    request: RoadmapRequest
):

    goal = request.goal.strip()

    if not goal:
        raise HTTPException(
            status_code=400,
            detail="Goal is required",
        )

    try:

        roadmap, source_count = _make_roadmap(goal, request.content)

        return {
            "goal": goal,
            "roadmap": roadmap,
            "sources": source_count,
            "type": "roadmap",
        }

    except Exception as error:

        print(
            "Roadmap generation error:",
            str(error)
        )

        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate roadmap: {error}",
        )


# -----------------------------
# AI QUIZ
# -----------------------------

@app.post("/quiz")
def generate_quiz(
    request: QuizRequest
):

    topic = request.topic.strip()

    if not topic:
        raise HTTPException(
            status_code=400,
            detail="Topic is required",
        )

    try:

        content = (request.content or "").strip()

        has_context = False
        context = ""
        docs = []

        if content:
            has_context = True
            context = content
        else:
            # Retrieve relevant documents
            docs = _retrieve(f"Create a quiz about {topic}")

            # Combine retrieved context
            context = "\n\n".join(
                doc.page_content for doc in docs
            )

            has_context = bool(context.strip())

        # If a document was uploaded, base the quiz
        # only on it. Otherwise use general knowledge.
        if has_context:
            source_instruction = (
                "Use ONLY the provided context."
            )
        else:
            source_instruction = (
                "Use your own general knowledge "
                "about the topic. No document has "
                "been uploaded."
            )

        quiz_prompt = f"""
You are an AI quiz generator.

{source_instruction}

Create exactly 5 multiple-choice questions about:
{topic}

Return ONLY valid JSON.

Do NOT use markdown.
Do NOT use ```json.
Do NOT add explanations before or after the JSON.

Use exactly this structure:

{{
  "questions": [
    {{
      "question": "Question text",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correctAnswer": "Option A",
      "topic": "{topic}"
    }}
  ]
}}

Every question must have exactly 4 options.

The correctAnswer must exactly match
one of the four options.
"""

        if has_context:
            quiz_prompt += f"""
Context:
{context}
"""

        # Ask Grok
        response = llm.invoke(
            quiz_prompt
        )

        raw_content = response.content

        print("Grok quiz response:")
        print(raw_content)

        # Parse JSON
        try:

            quiz_data = _extract_json(raw_content)

        except Exception as json_error:

            print(
                "Invalid Grok quiz JSON:",
                json_error
            )

            print(
                "Raw response:",
                raw_content
            )

            raise HTTPException(
                status_code=500,
                detail="AI returned invalid quiz JSON",
            )

        # Validate basic structure
        if "questions" not in quiz_data:
            raise HTTPException(
                status_code=500,
                detail="AI quiz response does not contain questions",
            )

        questions = quiz_data["questions"]

        if not isinstance(questions, list):
            raise HTTPException(
                status_code=500,
                detail="AI quiz questions must be an array",
            )

        if len(questions) != 5:
            raise HTTPException(
                status_code=500,
                detail="AI did not generate exactly 5 questions",
            )

        # Validate every question
        for question in questions:

            if "question" not in question:
                raise HTTPException(
                    status_code=500,
                    detail="Quiz question is missing question text",
                )

            if "options" not in question:
                raise HTTPException(
                    status_code=500,
                    detail="Quiz question is missing options",
                )

            if "correctAnswer" not in question:
                raise HTTPException(
                    status_code=500,
                    detail="Quiz question is missing correct answer",
                )

            if len(question["options"]) != 4:
                raise HTTPException(
                    status_code=500,
                    detail="Each quiz question must have exactly 4 options",
                )

            if question["correctAnswer"] not in question["options"]:
                raise HTTPException(
                    status_code=500,
                    detail="Correct answer must match one of the options",
                )

        # Return real JSON
        return {
            "topic": topic,
            "quiz": quiz_data,
            "sources": len(docs),
        }

    except HTTPException:
        raise

    except Exception as error:

        print(
            "Quiz generation error:",
            str(error)
        )

        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate quiz: {error}",
        )


# -----------------------------
# AI FLASHCARDS
# -----------------------------

@app.post("/flashcards")
def generate_flashcards(
    request: FlashcardRequest
):

    topic = request.topic.strip()

    if not topic:
        raise HTTPException(
            status_code=400,
            detail="Topic is required",
        )

    try:

        content = (request.content or "").strip()

        docs = []
        context = ""

        # Only use retrieval when no content
        # was supplied by the caller.
        if not content:
            docs = _retrieve(
                f"Create flashcards about {topic}"
            )

            context = "\n\n".join(
                doc.page_content
                for doc in docs
            )

        has_context = bool(context or content)

        if has_context:
            source_instruction = (
                "Use ONLY the provided context."
            )
        else:
            source_instruction = (
                "Use your own general knowledge "
                "about the topic. No document has "
                "been uploaded."
            )

        flashcard_prompt = f"""
You are an AI flashcard generator.

{source_instruction}

Create exactly 7 flashcards about:
{topic}

Return ONLY valid JSON.

Do NOT use markdown.
Do NOT use ```json.
Do NOT add explanations before or after the JSON.

Use exactly this structure:

{{
  "cards": [
    {{
      "front": "Question or prompt",
      "back": "Answer or explanation"
    }}
  ]
}}

Each front should be a short question or keyword.
Each back should be a clear, concise answer.
Aim for varied and important facts.
"""

        if has_context:
            if context:
                flashcard_prompt += f"""
Context:
{context}
"""
            else:
                flashcard_prompt += f"""
Lesson content:
{content}
"""

        # Ask Grok
        response = llm.invoke(
            flashcard_prompt
        )

        raw_content = response.content

        print("Grok flashcards response:")
        print(raw_content)

        # Parse JSON
        try:

            flashcard_data = _extract_json(raw_content)

        except Exception as json_error:

            print(
                "Invalid Grok flashcard JSON:",
                json_error
            )

            print(
                "Raw response:",
                raw_content
            )

            raise HTTPException(
                status_code=500,
                detail="AI returned invalid flashcard JSON",
            )

        # Validate structure
        if "cards" not in flashcard_data:
            raise HTTPException(
                status_code=500,
                detail="AI flashcard response does not contain cards",
            )

        cards = flashcard_data["cards"]

        if not isinstance(cards, list):
            raise HTTPException(
                status_code=500,
                detail="AI flashcard cards must be an array",
            )

        clean_cards = []

        for card in cards:
            if isinstance(card, str):
                card = {"front": card, "back": ""}

            if "front" not in card or "back" not in card:
                raise HTTPException(
                    status_code=500,
                    detail="Each flashcard must have a front and back",
                )

            if str(card.get("front") or "").strip() and str(
                card.get("back") or ""
            ).strip():
                clean_cards.append(
                    {
                        "front": str(card["front"]).strip(),
                        "back": str(card["back"]).strip(),
                    }
                )

        if not clean_cards:
            raise HTTPException(
                status_code=500,
                detail="AI did not generate any usable flashcards",
            )

        return {
            "topic": topic,
            "cards": clean_cards,
            "sources": len(docs),
        }

    except HTTPException:
        raise

    except Exception as error:

        print(
            "Flashcard generation error:",
            str(error)
        )

        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate flashcards: {error}",
        )