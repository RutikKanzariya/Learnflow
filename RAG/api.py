from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import io
import json
import re

from langchain_google_genai import (
    ChatGoogleGenerativeAI,
    GoogleGenerativeAIEmbeddings,
)

from langchain_chroma import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.documents import Document

from langchain_text_splitters import RecursiveCharacterTextSplitter

from pypdf import PdfReader

import io


# Load environment variables
load_dotenv()

import os


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
# -----------------------------

embedding_model = GoogleGenerativeAIEmbeddings(
    model="gemini-embedding-2"
)


vector_store = Chroma(
    persist_directory=CHROMA_DB_DIR,
    embedding_function=embedding_model,
)


retriever = vector_store.as_retriever(
    search_type="mmr",
    search_kwargs={
        "k": 4,
        "fetch_k": 10,
        "lambda_mult": 0.5,
    },
)


llm = ChatGoogleGenerativeAI(
    model="models/gemini-flash-latest"
)


prompt = ChatPromptTemplate([
    (
        "system",
        """You are a helpful AI tutor.

Use ONLY the provided context to answer the question.

If the answer is not present in the context,
say:

"I could not find the answer in the document."
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
# REQUEST MODELS
# -----------------------------

class QuestionRequest(BaseModel):
    question: str


class QuizRequest(BaseModel):
    topic: str


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
        vector_store.add_documents(chunk_docs)

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
            detail="Could not read PDF",
        )


# -----------------------------
# RAG QUESTION
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

        # Retrieve relevant documents
        try:
            docs = retriever.invoke(question)
        except Exception:
            docs = []

        # Combine retrieved documents
        context = "\n\n".join(
            doc.page_content
            for doc in docs
        )

        # If no document has been uploaded,
        # answer using the LLM general knowledge.
        if not context.strip():
            fallback_prompt = f"""You are a helpful AI tutor.

No document has been uploaded, so answer the
question using your own general knowledge.

Give a clear and well formatted answer.

Question:
{question}
"""

            response = llm.invoke(
                fallback_prompt
            )

            return {
                "question": question,
                "answer": response.content,
                "sources": len(docs),
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
            "answer": response.content,
            "sources": len(docs),
        }

    except Exception as error:

        print(
            "RAG error:",
            str(error)
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to generate answer",
        )


# -----------------------------
# AI QUIZ
# -----------------------------

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

        # Retrieve relevant documents
        try:
            docs = retriever.invoke(
                f"Create a quiz about {topic}"
            )
        except Exception:
            docs = []

        # Combine retrieved context
        context = "\n\n".join(
            doc.page_content
            for doc in docs
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

        # Ask Gemini
        response = llm.invoke(
            quiz_prompt
        )

        raw_content = response.content

        print("Gemini quiz response:")
        print(raw_content)

        # Convert response to string
        if isinstance(raw_content, list):
            raw_content = "".join(
                str(item)
                for item in raw_content
            )

        raw_content = str(raw_content).strip()

        # Remove markdown JSON fences if Gemini adds them
        raw_content = re.sub(
            r"^```json\s*",
            "",
            raw_content,
            flags=re.IGNORECASE,
        )

        raw_content = re.sub(
            r"^```\s*",
            "",
            raw_content,
        )

        raw_content = re.sub(
            r"\s*```$",
            "",
            raw_content,
        )

        raw_content = raw_content.strip()

        # Parse JSON
        try:

            quiz_data = json.loads(
                raw_content
            )

        except json.JSONDecodeError as json_error:

            print(
                "Invalid Gemini JSON:",
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
            detail="Failed to generate quiz",
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
            try:
                docs = retriever.invoke(
                    f"Create flashcards about {topic}"
                )
            except Exception:
                docs = []

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

        # Ask Gemini
        response = llm.invoke(
            flashcard_prompt
        )

        raw_content = response.content

        print("Gemini flashcards response:")
        print(raw_content)

        # Convert response to string
        if isinstance(raw_content, list):
            raw_content = "".join(
                str(item)
                for item in raw_content
            )

        raw_content = str(raw_content).strip()

        # Remove markdown JSON fences if Gemini adds them
        raw_content = re.sub(
            r"^```json\s*",
            "",
            raw_content,
            flags=re.IGNORECASE,
        )

        raw_content = re.sub(
            r"^```\s*",
            "",
            raw_content,
        )

        raw_content = re.sub(
            r"\s*```$",
            "",
            raw_content,
        )

        raw_content = raw_content.strip()

        # Parse JSON
        try:

            flashcard_data = json.loads(
                raw_content
            )

        except json.JSONDecodeError as json_error:

            print(
                "Invalid Gemini flashcard JSON:",
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

        for card in cards:

            if "front" not in card or "back" not in card:
                raise HTTPException(
                    status_code=500,
                    detail="Each flashcard must have a front and back",
                )

        return {
            "topic": topic,
            "cards": cards,
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
            detail="Failed to generate flashcards",
        )