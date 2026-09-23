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

### Learning Experience Features

- **Gamification** — earn XP from quizzes and lessons, level up, build daily streaks, and compete on a global leaderboard
- **Spaced Repetition** — create review items and get them scheduled back based on how well you remember them (Again / Hard / Good / Easy)
- **Flashcards** — auto-generate flashcard sets from lessons or topics via AI, or create manual sets, then study with a flip-card UI
- **Voice-based Learning** — ask the AI Tutor by voice (speech-to-text) and have answers read aloud (text-to-speech)
- **Collaborative Study Rooms** — create or join study rooms and chat with other learners in real time
- **Bookmarks & Notes** — bookmark lessons for quick reference and jot notes on any lesson page

---

## Recent Enhancements

- **Quiz & RAG generation now works without an uploaded document** — when no document context exists, the RAG service falls back to Gemini general knowledge instead of failing (applies to `<DocumentChat>` Q&A, quiz generation, and roadmap generation).
- **PDF upload now truly indexes content** — uploaded PDFs are split into chunks and stored in the ChromaDB vector store so later questions are grounded in the document.
- **New RAG endpoint** — `POST /flashcards` generates AI flashcard decks.
- **XP rewards** — completing a lesson grants `15 XP`; finishing a quiz grants `20 XP + score × 10`.
- **Frontend** — 5 new pages (`/leaderboard`, `/reviews`, `/flashcards`, `/study-rooms`, `/notes`) added to navigation behind the protected routes, plus AI Tutor voice/TTS and lesson shortcuts on the course details page.

---

## New API Endpoints

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `GET` | `/api/v1/gamification` | Current user's XP, level, streak, badges |
| `GET` | `/api/v1/gamification/leaderboard` | Global leaderboard (top users) |
| `GET` | `/api/v1/reviews` | Due review items today |
| `GET` | `/api/v1/reviews/upcoming` | Upcoming review items |
| `POST` | `/api/v1/reviews` | Create a review item |
| `POST` | `/api/v1/reviews/:id/review` | Grade a review (reschedules it) |
| `DELETE` | `/api/v1/reviews/:id` | Remove a review item |
| `GET` | `/api/v1/flashcards` | User's flashcard sets |
| `GET` | `/api/v1/flashcards/:id` | A single flashcard set with cards |
| `POST` | `/api/v1/flashcards/generate/lesson` | Generate flashcards from a lesson |
| `POST` | `/api/v1/flashcards/generate/topic` | Generate flashcards from a topic |
| `POST` | `/api/v1/flashcards` | Create a manual flashcard set |
| `DELETE` | `/api/v1/flashcards/:id` | Delete a flashcard set |
| `GET` | `/api/v1/study-rooms` | List study rooms |
| `POST` | `/api/v1/study-rooms` | Create a study room |
| `GET` | `/api/v1/study-rooms/:id/messages` | Room chat history |
| `POST` | `/api/v1/study-rooms/:id/messages` | Send a room chat message |
| `GET` | `/api/v1/notes` | Current user's notes |
| `POST` | `/api/v1/notes` | Create a note for a lesson |
| `PUT` | `/api/v1/notes/:id` | Update a note |
| `DELETE` | `/api/v1/notes/:id` | Delete a note |
| `GET` | `/api/v1/bookmarks` | Bookmarked lessons |
| `POST` | `/api/v1/bookmarks` | Toggle bookmark on a lesson |
| `GET` | `/api/v1/bookmarks/lesson/:lessonId` | Check if a lesson is bookmarked |
| `POST` | `http://localhost:8000/flashcards` | RAG service — generate flashcards from a topic |

---

## Tech Stack

### Frontend

- React.js
- TypeScript
- Vite
- Axios
- React Router
- Web Speech API (speech-to-text input, text-to-speech read-aloud)

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
