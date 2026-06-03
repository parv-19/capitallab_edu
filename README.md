# Capital Lab Education

Capital Lab Education is a monorepo for the platform website, student dashboard, admin dashboard, and backend APIs that power lead capture, course delivery, authentication, and the AI study assistant.

## Stack

- Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS
- Backend: Node.js, Express, TypeScript, Mongoose
- Database: MongoDB
- AI/RAG: OpenAI, Anthropic, Groq, local embedding and LLM options
- Auth: JWT access tokens with refresh flow and cookies

## Repository Structure

```text
.
|- frontend/   Next.js app for marketing pages, auth, student area, and admin area
|- backend/    Express API, MongoDB models, auth, course management, RAG services
|- Docs/       Project docs and reference material
|- package.json
```

## Main Features

- Public website with homepage, about, courses, and testimonials pages
- Student flows for login, enrolled courses, profile, and AI chat
- Admin flows for leads, students, testimonials, settings, courses, lessons, and documents
- Backend APIs for auth, courses, leads, testimonials, admin, student, chat, and RAG
- Document ingestion pipeline for AI-assisted study chat using vector search

## Prerequisites

- Node.js 18+
- npm
- MongoDB connection string
- API keys depending on the providers you want to use
- Optional Gmail app password for email flows

## Install

From the repo root:

```bash
npm install
```

This repository uses npm workspaces for `frontend` and `backend`.

## Environment Setup

### Backend

Create `backend/.env` from [backend/.env.example](/d:/capitallab/backend/.env.example).

Important variables:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=
JWT_SECRET=
JWT_REFRESH_SECRET=
FRONTEND_URL=http://localhost:3000

OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GROQ_API_KEY=

LLM_PROVIDER=local
LOCAL_LLM_MODEL=llama3.1
LOCAL_LLM_BASE_URL=http://127.0.0.1:11434/v1
OPENAI_LLM_MODEL=gpt-4o-mini
ANTHROPIC_LLM_MODEL=claude-3-5-sonnet-latest
GROQ_MODEL=llama-3.1-8b-instant

EMBEDDING_PROVIDER=local
LOCAL_EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
VECTOR_INDEX_NAME=document_chunks_vector_index
```

Notes:

- `FRONTEND_URL` must match the frontend origin for CORS.
- You can run with local or hosted LLM and embedding providers.
- Uploads are served from `backend/uploads`.

### Frontend

Create `frontend/.env.local` from [frontend/.env.example](/d:/capitallab/frontend/.env.example).

Required variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Running Locally

### Option 1: run each app separately

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

### Option 2: use root workspace scripts

Frontend:

```bash
npm run dev
```

Backend:

```bash
npm run dev:backend
```

Helpful root scripts:

```bash
npm run dev
npm run dev:frontend
npm run dev:backend
npm run build
```

Local URLs:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`

## Backend Scripts

From `backend/`:

```bash
npm run dev
npm run build
npm run start
npm run test:rag-demo
npm run test:rag-health
```

## Frontend Scripts

From `frontend/`:

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## API Areas

The backend currently mounts these route groups:

- `/api/auth`
- `/api/courses`
- `/api/leads`
- `/api/testimonials`
- `/api/admin`
- `/api/student`
- `/api/rag`
- chat routes under `/api`

Entry point: [backend/src/index.ts](/d:/capitallab/backend/src/index.ts)

## RAG and Vector Search

To use the AI study assistant fully, configure a MongoDB Atlas vector index with the name:

```text
document_chunks_vector_index
```

Default embedding dimension in the sample env is:

```text
1536
```

The backend includes services for:

- document parsing
- chunking
- embedding generation
- vector storage
- retrieval and answer generation

Relevant files:

- [backend/src/services/ragIngestion.service.ts](/d:/capitallab/backend/src/services/ragIngestion.service.ts)
- [backend/src/services/ragRetrieval.ts](/d:/capitallab/backend/src/services/ragRetrieval.ts)
- [backend/src/services/ragChat.service.ts](/d:/capitallab/backend/src/services/ragChat.service.ts)
- [backend/src/config/rag.ts](/d:/capitallab/backend/src/config/rag.ts)

## Frontend Areas

The Next.js app includes:

- public pages in [frontend/app](/d:/capitallab/frontend/app)
- student dashboard routes under `frontend/app/student`
- admin dashboard routes under `frontend/app/admin`
- shared components in `frontend/components`
- auth state in [frontend/contexts/AuthContext.tsx](/d:/capitallab/frontend/contexts/AuthContext.tsx)

If you need page-level frontend details, see [frontend/README.md](/d:/capitallab/frontend/README.md).

## Deployment Notes

- Frontend includes `frontend/vercel.json`
- Backend includes `backend/railway.json`
- Set all environment variables in your hosting platform before deploying
- Keep frontend `NEXT_PUBLIC_API_URL` and backend `FRONTEND_URL` aligned

## Troubleshooting

- If the frontend behaves oddly in dev, clear `frontend/.next` and restart `npm run dev`.
- If auth requests fail, verify `NEXT_PUBLIC_API_URL`, backend status, and CORS config.
- If AI answers are weak or empty, recheck provider keys, vector index name, and document ingestion.

## Status

The repo is set up as a working full-stack monorepo with separate frontend and backend apps, workspace scripts at the root, and AI/RAG support wired into the backend.
