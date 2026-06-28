#  Mantis — AI Product Diagnostic Platform

> **"Like having a expert technician in your pocket."**  
> Mantis turns your product manuals and repair videos into an intelligent, conversational diagnostic assistant.

---

## The Problem

When a product breaks, users are left searching through 50-page manuals, watching irrelevant YouTube videos, or waiting days for a technician. Companies spend thousands on support calls for issues that could be solved in minutes.

## The Solution

Mantis lets companies upload their product documentation once. Users then get instant, intelligent, cited diagnostic assistance — the AI asks focused follow-up questions, references exact pages from the manual, and guides users to a fix step by step.

---

##  Demo
Meet Mantis — an AI diagnostic platform that turns product manuals into intelligent support.
A user types: 'water is leaking from my AC.' Instantly, Mantis references Section 3, Page 15 of the official manual — checking the drain pipe, air filter, and evaporator coils — with exact page citations.
No 50-page manual. No waiting for a technician. Just precise, cited, step-by-step guidance — powered by your own product documentation.
This is Mantis

[▶ Watch Full Demo Video](https://github.com/user-attachments/assets/a6584355-9b3e-4e37-ba81-367d73640ed4)

## Deployed link: https://mantis-7.onrender.com

---

## Features

### Core
 **Conversational AI Diagnosis** — asks ONE focused question at a time to narrow down the issue
 **Manual-cited Answers** — every response cites the exact page and section from the official manual
 **Multi-turn Memory** — remembers the full conversation context via MongoDB
 **Video Support** — Whisper transcribes repair videos; AI directs users to exact timestamps
 **Image Troubleshooting** — upload photos of error screens or damaged parts for visual diagnosis
 **Multi-language** — ask questions in any language, get answers in the same language

### Bonus Features Implemented
| Feature | Status |
|---|---|
| Image-based Troubleshooting | Grok Vision |
| Video Timestamp Citations | Whisper + ChromaDB |
| Multi-language Support | LLaMA 3.3 70B |

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| Next.js 15 | Core React framework with SSR and secure API routes |
| Tailwind CSS v4 | Utility-first styling for the dark-mode industrial UI |
| shadcn/ui | Accessible UI components (cards, inputs, progress bars) |
| MongoDB Atlas | Cloud NoSQL database for product metadata and garage records |
| Mongoose | ODM library for structured user and product schemas |
| AWS S3 | Cloud storage for manuals, repair videos, and fault photos |
| AWS Pre-signed URLs | Secure direct-to-cloud file uploads without exposing credentials |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI | High-performance Python REST API framework |
| ChromaDB | Persistent vector database for semantic search over manuals |
| MOSS (inferedge-moss) | Fast MiniLM-based search layer for sub-10ms retrieval |
| Groq (LLaMA 3.3 70B) | Primary LLM for fast, accurate diagnostic responses |
| Grok Vision (grok-2-vision) | Vision model for image-based troubleshooting |
| MongoDB + Motor | Async database for persistent conversation history |
| pdfplumber | PDF text extraction and intelligent chunking |
| OpenAI Whisper | Speech-to-text transcription of repair videos |
| yt-dlp + ffmpeg | YouTube video audio extraction |
| python-dotenv | Secure environment variable management |

---

## How It Works
Company uploads PDF manual or repair video

↓

/ingest/pdf  or  /ingest/transcript

↓

pdfplumber extracts text → chunks into ~400 word pieces

Whisper transcribes video → timestamped segments

↓

ChromaDB stores chunks as semantic vectors

MOSS indexes chunks for fast retrieval

↓

User describes their issue in the chat

↓

MOSS finds top matching chunks instantly

ChromaDB fetches full chunks with page/timestamp metadata

↓

LLaMA 3.3 70B receives chunks + conversation history

Responds with diagnosis + exact page citation + video timestamp

↓

MongoDB saves conversation for multi-turn memory

---

## ⚙️ Setup & Installation

### Prerequisites
- Python 3.13+
- Node.js 18+
- MongoDB (local or Atlas)
- ffmpeg (`brew install ffmpeg`)

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create `backend/.env`:
```env
GROQ_API_KEY=your_groq_api_key
GROK_API_KEY=your_grok_api_key
MOSS_PROJECT_ID=your_moss_project_id
MOSS_PROJECT_KEY=your_moss_project_key
MONGODB_URI=mongodb://localhost:27017
```

Start the server:
```bash
python3 -m uvicorn main:app --reload --port 8000
```

Swagger docs available at: **http://localhost:8000/docs**

### Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```env
# Database
MONGODB_URI=your_mongodb_uri

# AWS S3
AWS_REGION=your_region
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET_NAME=your_bucket

# AI
OPENAI_API_KEY=your_key
```

Start the dev server:
```bash
npm run dev
```

Open **http://localhost:3000**

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| POST | `/ingest/pdf/{product_id}` | Upload and index a PDF manual |
| POST | `/ingest/transcript/{product_id}/{video_id}` | Upload and index a video transcript |
| GET | `/ingest/stats/{product_id}` | Check how many chunks are indexed |
| POST | `/diagnose/` | Single-turn AI diagnosis |
| POST | `/chat/{product_id}` | Multi-turn diagnostic chat |
| GET | `/documents/{product_id}` | Get document stats |
| DELETE | `/documents/{product_id}` | Delete product knowledge base |

---

## 🎯 Demo Products

| Product | Manual | Video Transcript |
|---|---|---|
| Air Conditioner |  128 chunks |  147 segments |
| Washing Machine |  153 chunks | — |
| Monitor |  113 chunks | — |

---

## Project Structure
Mantis/

├── backend/

│   ├── main.py

│   ├── routers/

│   │   ├── ingest.py

│   │   ├── diagnose.py

│   │   ├── chat.py

│   │   └── documents.py

│   ├── services/

│   │   ├── chroma_service.py

│   │   ├── pdf_service.py

│   │   ├── video_service.py

│   │   ├── moss_service.py

│   │   ├── agent_service.py

│   │   ├── grok_service.py

│   │   ├── llm_service.py

│   │   └── db_service.py

│   ├── models/

│   │   ├── user.py

│   │   ├── product.py

│   │   └── chat.py

│   ├── knowledge/

│   │   ├── knowledge_graph.json

│   │   └── transcripts/

│   └── scripts/

│       └── run_whisper.py

└── frontend/

├── src/

│   ├── app/

│   ├── components/

│   ├── models/

│   └── lib/

└── package.json







