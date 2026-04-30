# Capital Lab Education - Platform Documentation

This repository contains the complete source code for the Capital Lab Education platform, featuring a Next.js App Router frontend, a Node/Express backend, and a fully integrated RAG-based AI Chatbot powered by MongoDB Atlas Vector Search.

## 🏗️ Architecture

- **Frontend:** Next.js 14, React, Tailwind CSS, TypeScript
- **Backend:** Node.js, Express.js, TypeScript
- **Database:** MongoDB Atlas (Mongoose ODM)
- **AI / LLM:** Anthropic Claude (claude-3-5-sonnet), OpenAI (text-embedding-3-small)
- **Authentication:** Custom JWT (HttpOnly cookies)

## 🚀 Local Setup

### 1. Prerequisites
- Node.js (v18 or higher)
- A MongoDB Atlas Cluster (Free tier works)
- OpenAI API Key
- Anthropic API Key
- A Gmail App Password (for Nodemailer)

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `/backend` directory based on `.env.example`.

**Start the backend server:**
```bash
npm run dev
```
The API will be available at `http://localhost:5000`.

### 3. Frontend Setup
```bash
cd frontend
npm install
```
Create a `.env.local` file in the `/frontend` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Start the frontend server:**
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

---

## 🤖 RAG Chatbot & Vector Search Setup

To enable the AI Study Assistant, you **must** configure a Vector Search Index in your MongoDB Atlas cluster.

1. Go to your MongoDB Atlas dashboard.
2. Select your cluster and go to the **Search** tab.
3. Click **Create Search Index** and choose the **JSON Editor**.
4. Select your database (`capitallab`) and collection (`documentchunks`).
5. Set the index name exactly to: `document_chunks_vector_index`
6. Paste the following JSON mapping:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "courseId"
    }
  ]
}
```

Once the index finishes building, the RAG pipeline is ready! Upload documents via the Admin Dashboard, click "Process for AI", and then test the Chatbot in the Student Dashboard.

---

## 🌍 Production Deployment

### Frontend (Vercel)
The frontend is pre-configured with a `vercel.json` file to automatically rewrite API calls to the production backend and enforce strict security headers.
1. Connect the repository to Vercel.
2. Set the Environment Variables:
   - `NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api`
   - `NEXT_PUBLIC_SITE_URL=https://yourdomain.com`

### Backend (Railway / Render)
The backend is pre-configured with a `railway.json` file.
1. Connect the `/backend` folder to Railway.
2. Provide all environment variables from `.env.example` in the Railway dashboard.
3. Set `PORT=5000` (or leave empty if Railway automatically binds).
4. Ensure the `FRONTEND_URL` exactly matches your Vercel URL so CORS doesn't block requests.
