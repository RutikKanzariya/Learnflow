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

from pypdf import PdfReader

import io


# Load environment variables
load_dotenv()


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
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# RAG SETUP
# -----------------------------

embedding_model = GoogleGenerativeAIEmbeddings(
    model="gemini-embedding-2"
)


vector_store = Chroma(
    persist_directory="chroma-db",
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

        return {
            "filename": file.filename,
            "pages": len(pages),
            "characters": len(full_text),
            "message": "PDF uploaded successfully",
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
        docs = retriever.invoke(question)

        # Combine retrieved documents
        context = "\n\n".join(
            doc.page_content
            for doc in docs
        )

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
        docs = retriever.invoke(
            f"Create a quiz about {topic}"
        )

        # Combine retrieved context
        context = "\n\n".join(
            doc.page_content
            for doc in docs
        )

        quiz_prompt = f"""
You are an AI quiz generator.

Use ONLY the provided context.

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