# LearnFlow — AI-Powered Personalized Learning Platform

LearnFlow is a full-stack AI-powered personalized learning platform designed to help students learn more effectively through personalized roadmaps, AI-powered tutoring, quizzes, progress tracking, and adaptive recommendations.

The project combines a **MERN-style application architecture** with a separate **Python/FastAPI RAG service** for AI functionality.

---

## Features

- User registration and login
- JWT-based authentication
- Course and lesson management
- Lesson completion and progress tracking
- Quiz creation and submission
- Automatic quiz evaluation
- Topic-level skill/mastery tracking
- Personalized learning recommendations
- AI-generated learning roadmaps
- AI-powered tutor
- RAG-based document question answering
- PDF document upload
- AI quiz generation
- Dashboard and learning analytics
- RESTful APIs
- Input validation
- API rate limiting
- Security middleware
- Docker support
- GitHub Actions CI

---

## Tech Stack

### Frontend

- React.js
- TypeScript
- Vite
- Axios
- React Router

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- Zod
- Helmet
- express-rate-limit
- CORS

### AI / RAG Service

- Python
- FastAPI
- LangChain
- Google Gemini
- Gemini Embeddings
- ChromaDB
- PyPDF

### DevOps(Future)

- Docker
- Docker Compose
- Git
- GitHub
- GitHub Actions

---

# System Architecture

```text
                         ┌─────────────────────┐
                         │     React Frontend  │
                         │   React + TypeScript│
                         └──────────┬──────────┘
                                    │
                                    │ HTTP / REST API
                                    ▼
                         ┌─────────────────────┐
                         │   Node.js Backend   │
                         │  Express.js + JWT   │
                         └──────────┬──────────┘
                                    │
                       ┌────────────┴────────────┐
                       │                         │
                       ▼                         ▼
              ┌─────────────────┐      ┌─────────────────┐
              │    MongoDB      │      │  Python AI      │
              │   + Mongoose    │      │    Service      │
              └─────────────────┘      │    FastAPI      │
                                       └────────┬────────┘
                                                │
                                     ┌──────────┴──────────┐
                                     │                     │
                                     ▼                     ▼
                               ┌───────────┐        ┌────────────┐
                               │ ChromaDB  │        │   Gemini   │
                               │ Vector DB │        │    LLM     │
                               └───────────┘        └────────────┘
