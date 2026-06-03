You are working on my existing CapitalLab Edu project.

Goal:
Upgrade the current RAG chatbot into a polished ChatGPT/Claude-style educational chatbot for CFA students.

Important:
Do not randomly refactor the whole project.
Do not break existing frontend/backend flows.
Do not remove current working upload/chunking logic unless replacing it safely.
Keep all changes incremental, testable, and production-friendly.

Current issue/context:
- PDF parsing and chunking already work.
- Embedding provider must support local and remote providers.
- In development, default should be local embeddings.
- The product needs a professional RAG pipeline, not a basic PDF Q&A bot.

==================================================
TARGET PRODUCT EXPERIENCE
==================================================

Build a chatbot experience similar to ChatGPT/Claude:

Student side:
- New chat
- Saved conversations
- Reload previous chat
- Streaming answers
- Markdown formatted answers
- Source citations from uploaded documents
- Regenerate answer
- Copy answer
- Like/dislike feedback
- Subject/chapter filter if available
- Clear fallback when answer is not found in uploaded docs

Admin/tutor side:
- Upload documents
- View document processing status
- See completed/failed documents
- Delete documents
- Reindex documents
- View chunk count
- View embedding provider used
- See errors for failed documents
- Manage course/subject/chapter metadata

==================================================
BACKEND REQUIREMENTS
==================================================

1. RAG configuration

Create or improve config so these env values are supported:

LLM_PROVIDER=local
LOCAL_LLM_MODEL=llama3.1
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

EMBEDDING_PROVIDER=local
LOCAL_EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_BATCH_SIZE=12
EMBEDDING_TIMEOUT_MS=30000

RAG_TOP_K=8
RAG_RERANK_TOP_K=4
RAG_MIN_SCORE=0.72
DEBUG_RAG=true

Rules:
- Do not hardcode OpenAI as the default in development.
- Use local embeddings by default if no provider is set.
- Keep OpenAI and Anthropic support extendable.
- Log selected providers at backend startup.

Expected logs:
[RAG][config] LLM_PROVIDER=local
[RAG][config] EMBEDDING_PROVIDER=local
[RAG][config] EMBEDDING_BATCH_SIZE=12

2. Document model

Ensure documents have these fields where possible:

title
originalName
mimeType
size
course
subject
chapter
level
tags
uploadedBy
status: uploaded | processing | completed | failed
chunkCount
embeddingProvider
errorMessage
createdAt
updatedAt

3. Chunk model

Ensure chunks store:

documentId
chunkIndex
text
pageNumber
sectionTitle
course
subject
chapter
tags
embedding
tokenCount
metadata
createdAt

4. Ingestion pipeline

Improve ingestion flow:

upload document
→ mark uploaded
→ mark processing
→ extract text
→ smart chunk text
→ generate embeddings in batches
→ store chunks
→ mark completed

Failure rule:
If parsing, chunking, embedding, or storage fails:
- mark document as failed
- save clear errorMessage
- log exact failed stage

Do not leave documents stuck in processing.

Expected logs:
[RAG][ingest] Document received
[RAG][ingest] Extracted text
[RAG][ingest] Created X chunk(s)
[RAG][embedding] Provider: local
[RAG][embedding] Batch 1/N
[RAG][embedding] Generated X embedding(s)
[RAG][ingest] Stored X chunk(s)
[RAG][ingest] Document marked completed

5. Timeout protection

Add timeout protection around embedding generation.

Use:
EMBEDDING_TIMEOUT_MS

If timeout happens:
- stop the ingestion safely
- mark document failed
- save message like: "Embedding generation timed out after 30000ms"
- do not crash the backend

6. Smart chunking

Improve chunking to prefer:
- headings
- paragraphs
- sections
- token-aware splitting
- overlap

Recommended values:
chunk size: 700–1000 tokens
overlap: 100–150 tokens

Each chunk should preserve metadata:
- documentId
- pageNumber if available
- section title if available
- subject/chapter if provided

7. Retrieval pipeline

Implement a professional retrieval chain:

User query
→ classify if it is document-related
→ rewrite query for better search
→ vector search top K
→ optional metadata filter
→ rerank or score filter
→ context compression
→ answer generation with citations

Use env:
RAG_TOP_K
RAG_RERANK_TOP_K
RAG_MIN_SCORE

8. Query rewriting

Before retrieval, rewrite short or vague student questions.

Examples:
User: "duration explain"
Rewrite:
"Explain bond duration, Macaulay duration, modified duration, and interest rate sensitivity for CFA fixed income."

User: "what is tvm"
Rewrite:
"Explain Time Value of Money, present value, future value, discounting, and compounding for CFA Level 1."

Keep rewritten query internal.
Log it only when DEBUG_RAG=true.

9. Grounded answer generation

The chatbot must answer from uploaded documents when context exists.

Prompt rules:
- Use retrieved context as primary source.
- Include source citations.
- Do not invent facts.
- If context is weak, say the uploaded material does not contain enough information.
- Offer a general explanation separately only if useful.

Answer format:
- Direct answer
- Explanation
- Example if relevant
- Sources

10. Source citations

Return source info with answers:

source document title
page number if available
chapter/section if available
chunk id/reference

Frontend should show source cards below the answer.

11. Conversations

Add persistent conversations:

Conversation:
title
userId
createdAt
updatedAt

Message:
conversationId
role: user | assistant | system
content
sources
metadata
createdAt

Features:
- create new chat
- list chats
- open old chat
- save messages
- auto-generate title from first user question
- regenerate assistant answer

12. Feedback

Add feedback persistence:

Fields:
messageId
conversationId
userId
rating: like | dislike
reason
category: hallucinated | too_generic | slow | not_grounded | wrong_source | other
createdAt

13. Chat API

Implement or improve:

POST /api/chat
POST /api/chat/stream
GET /api/conversations
GET /api/conversations/:id
DELETE /api/conversations/:id
POST /api/messages/:id/feedback
POST /api/messages/:id/regenerate

Chat response should include:

answer
conversationId
messageId
sources
debug info only when DEBUG_RAG=true

14. Streaming

Add streaming response support if not present.

Frontend should feel like ChatGPT:
- user sends message
- assistant response streams token by token
- source cards appear after completion

15. Multi-provider LLM abstraction

Create provider abstraction:

llm/
  index.ts
  types.ts
  localProvider.ts
  openaiProvider.ts
  anthropicProvider.ts

embedding/
  index.ts
  types.ts
  localEmbeddingProvider.ts
  openaiEmbeddingProvider.ts

Rules:
- provider chosen by env
- easy to add new provider later
- no provider-specific logic inside route handlers

16. Admin document debugging

Admin should see:
- status
- chunk count
- embedding provider
- created date
- failure reason
- reindex button
- delete button

17. Security and validation

Validate:
- file type
- file size
- authenticated upload
- metadata values
- empty document text
- empty chunks
- no retrieved chunks

18. Testing checklist

After implementation, test:

A. Upload
- upload small PDF
- upload large PDF
- upload invalid file
- upload document with metadata

B. Ingestion
- status becomes processing
- chunks are created
- embeddings generated locally
- chunks stored
- status becomes completed
- failure marks document failed

C. Chat
- ask question from uploaded doc
- answer includes sources
- ask vague question
- query rewrite improves retrieval
- ask unrelated question
- bot does not hallucinate
- old conversation reloads

D. Feedback
- like answer
- dislike answer
- save reason/category

E. Provider switching
- local embeddings work
- OpenAI embeddings still supported
- local LLM works
- OpenAI/Anthropic can be configured later

==================================================
IMPORTANT SAFETY RULES
==================================================

Do not:
- break existing APIs unless migration is clearly handled
- remove current working code without replacement
- hardcode provider keys
- leave documents stuck in processing
- hallucinate answers without retrieved context
- expose debug logs to normal users
- block request forever during large document embedding

==================================================
FINAL OUTPUT REQUIRED
==================================================

After making changes, report:

1. Files changed
2. New files added
3. APIs added/updated
4. Env variables added
5. How RAG flow works now
6. How to test upload
7. How to test chat retrieval
8. Known limitations
9. Next recommended improvements



Bilkul, Gini. Tumhe sirf “PDF upload + answer” wala basic RAG nahi banana. Tumhe **Claude/ChatGPT style polished chatbot** banana hai — jisme upload, retrieval, source-grounded answers, memory, streaming, clean UI, admin CMS, feedback, and multi-provider LLM support ho.

Neeche exact product-level roadmap + IDE-agent prompt de raha hoon.

---

## What you should build

### 1. RAG should feel like ChatGPT/Claude

Current flow:

```txt
Upload PDF → chunks → embeddings → retrieval → answer
```

Target flow:

```txt
User asks question
→ classify intent
→ rewrite query
→ retrieve relevant chunks
→ rerank chunks
→ build grounded context
→ answer with sources
→ save conversation
→ collect feedback
→ improve retrieval/debugging
```

This makes the chatbot feel professional, not like a random PDF search box.

---

## Core features needed

### A. Document upload system

Admin/tutor should upload:

```txt
PDF
DOCX
PPTX
TXT
Markdown
```

Each document should have:

```txt
title
subject
chapter
level
tags
uploadedBy
status: uploaded | processing | completed | failed
chunkCount
errorMessage
createdAt
updatedAt
```

For CFA students, metadata is very important. Example:

```txt
Course: CFA Level 1
Subject: Quantitative Methods
Chapter: Time Value of Money
Topic: Annuities
Difficulty: Beginner
```

Without metadata, retrieval becomes messy.

---

### B. Better chunking

Do not chunk blindly only by character count.

Use smart chunking:

```txt
by heading
by section
by paragraph
fallback by tokens
overlap 100–200 tokens
```

Recommended:

```txt
chunk size: 700–1000 tokens
overlap: 100–150 tokens
```

Each chunk should store:

```txt
documentId
chunkIndex
text
pageNumber
sectionTitle
chapter
subject
embedding
metadata
```

---

### C. Local + paid embeddings support

For development:

```env
EMBEDDING_PROVIDER=local
```

For production quality, later add:

```env
EMBEDDING_PROVIDER=openai
```

Best setup:

```txt
local embeddings → cheap dev/testing
OpenAI embeddings → better production retrieval
```

But provider switching must be config-based.

---

### D. Retrieval should not be basic

Use this retrieval pipeline:

```txt
1. Query rewrite
2. Vector search
3. Metadata filtering
4. Reranking
5. Context compression
6. Answer generation
```

Example:

User asks:

```txt
Explain duration in fixed income
```

System rewrites internally:

```txt
What is bond duration, Macaulay duration, modified duration, and interest rate sensitivity in CFA fixed income?
```

Then retrieve better chunks.

---

### E. Answer should be grounded

Bot must answer only from uploaded docs when user asks course-related questions.

Good behavior:

```txt
Based on your uploaded CFA material, duration means...
```

If answer is not in docs:

```txt
I could not find this in the uploaded material. I can explain generally, but it may not be from your course notes.
```

This is very important. Otherwise hallucination ka circus shuru ho jaata hai.

---

### F. ChatGPT/Claude style UI

Frontend should include:

```txt
left sidebar conversations
new chat button
chat title generation
streaming answers
markdown rendering
source cards
copy button
regenerate button
like/dislike feedback
file upload panel
document status indicator
```

For admin/tutor:

```txt
upload docs
view processing status
delete/reindex documents
see failed documents
see student questions
see feedback analytics
```

For student:

```txt
ask questions
select subject/chapter
view source references
continue previous chats
```

---

## Recommended tech architecture

Since you already want **Next.js + Node/Express + MongoDB + LangChain**, this is the clean architecture:

```txt
frontend/
  Next.js
  chatbot UI
  admin panel
  tutor panel
  student panel

backend/
  Node Express
  auth
  document upload
  ingestion pipeline
  embeddings
  vector search
  chat API
  feedback API

database/
  MongoDB
  users
  documents
  chunks
  conversations
  messages
  feedback
```

For vector DB, choose one:

### Best simple choice

```txt
MongoDB Atlas Vector Search
```

Why: one database for documents + vectors. Less moving parts.

### Alternative

```txt
Qdrant
```

Why: excellent vector DB, local-friendly, scalable.

My strong opinion: for your product, use **MongoDB Atlas Vector Search** if you want simplicity. Use **Qdrant** if you want serious RAG infra from day one.

---

## Must-have backend APIs

```txt
POST /api/documents/upload
GET  /api/documents
GET  /api/documents/:id
DELETE /api/documents/:id
POST /api/documents/:id/reindex

POST /api/chat
GET  /api/conversations
GET  /api/conversations/:id
DELETE /api/conversations/:id

POST /api/feedback
```

Streaming endpoint:

```txt
POST /api/chat/stream
```

---

## Environment config

```env
# LLM
LLM_PROVIDER=local
LOCAL_LLM_MODEL=llama3.1
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Embeddings
EMBEDDING_PROVIDER=local
LOCAL_EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_BATCH_SIZE=12
EMBEDDING_TIMEOUT_MS=30000

# RAG
RAG_TOP_K=8
RAG_RERANK_TOP_K=4
RAG_MIN_SCORE=0.72
DEBUG_RAG=true

# DB
MONGODB_URI=
VECTOR_DB_PROVIDER=mongodb
```

---

# Exact Master Prompt for IDE Agent

Use this directly in Cursor/Codex/Claude Code.

```md
You are working on my existing CapitalLab Edu project.

Goal:
Upgrade the current RAG chatbot into a polished ChatGPT/Claude-style educational chatbot for CFA students.

Important:
Do not randomly refactor the whole project.
Do not break existing frontend/backend flows.
Do not remove current working upload/chunking logic unless replacing it safely.
Keep all changes incremental, testable, and production-friendly.

Current issue/context:
- PDF parsing and chunking already work.
- Embedding provider must support local and remote providers.
- In development, default should be local embeddings.
- The product needs a professional RAG pipeline, not a basic PDF Q&A bot.

==================================================
TARGET PRODUCT EXPERIENCE
==================================================

Build a chatbot experience similar to ChatGPT/Claude:

Student side:
- New chat
- Saved conversations
- Reload previous chat
- Streaming answers
- Markdown formatted answers
- Source citations from uploaded documents
- Regenerate answer
- Copy answer
- Like/dislike feedback
- Subject/chapter filter if available
- Clear fallback when answer is not found in uploaded docs

Admin/tutor side:
- Upload documents
- View document processing status
- See completed/failed documents
- Delete documents
- Reindex documents
- View chunk count
- View embedding provider used
- See errors for failed documents
- Manage course/subject/chapter metadata

==================================================
BACKEND REQUIREMENTS
==================================================

1. RAG configuration

Create or improve config so these env values are supported:

LLM_PROVIDER=local
LOCAL_LLM_MODEL=llama3.1
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

EMBEDDING_PROVIDER=local
LOCAL_EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_BATCH_SIZE=12
EMBEDDING_TIMEOUT_MS=30000

RAG_TOP_K=8
RAG_RERANK_TOP_K=4
RAG_MIN_SCORE=0.72
DEBUG_RAG=true

Rules:
- Do not hardcode OpenAI as the default in development.
- Use local embeddings by default if no provider is set.
- Keep OpenAI and Anthropic support extendable.
- Log selected providers at backend startup.

Expected logs:
[RAG][config] LLM_PROVIDER=local
[RAG][config] EMBEDDING_PROVIDER=local
[RAG][config] EMBEDDING_BATCH_SIZE=12

2. Document model

Ensure documents have these fields where possible:

title
originalName
mimeType
size
course
subject
chapter
level
tags
uploadedBy
status: uploaded | processing | completed | failed
chunkCount
embeddingProvider
errorMessage
createdAt
updatedAt

3. Chunk model

Ensure chunks store:

documentId
chunkIndex
text
pageNumber
sectionTitle
course
subject
chapter
tags
embedding
tokenCount
metadata
createdAt

4. Ingestion pipeline

Improve ingestion flow:

upload document
→ mark uploaded
→ mark processing
→ extract text
→ smart chunk text
→ generate embeddings in batches
→ store chunks
→ mark completed

Failure rule:
If parsing, chunking, embedding, or storage fails:
- mark document as failed
- save clear errorMessage
- log exact failed stage

Do not leave documents stuck in processing.

Expected logs:
[RAG][ingest] Document received
[RAG][ingest] Extracted text
[RAG][ingest] Created X chunk(s)
[RAG][embedding] Provider: local
[RAG][embedding] Batch 1/N
[RAG][embedding] Generated X embedding(s)
[RAG][ingest] Stored X chunk(s)
[RAG][ingest] Document marked completed

5. Timeout protection

Add timeout protection around embedding generation.

Use:
EMBEDDING_TIMEOUT_MS

If timeout happens:
- stop the ingestion safely
- mark document failed
- save message like: "Embedding generation timed out after 30000ms"
- do not crash the backend

6. Smart chunking

Improve chunking to prefer:
- headings
- paragraphs
- sections
- token-aware splitting
- overlap

Recommended values:
chunk size: 700–1000 tokens
overlap: 100–150 tokens

Each chunk should preserve metadata:
- documentId
- pageNumber if available
- section title if available
- subject/chapter if provided

7. Retrieval pipeline

Implement a professional retrieval chain:

User query
→ classify if it is document-related
→ rewrite query for better search
→ vector search top K
→ optional metadata filter
→ rerank or score filter
→ context compression
→ answer generation with citations

Use env:
RAG_TOP_K
RAG_RERANK_TOP_K
RAG_MIN_SCORE

8. Query rewriting

Before retrieval, rewrite short or vague student questions.

Examples:
User: "duration explain"
Rewrite:
"Explain bond duration, Macaulay duration, modified duration, and interest rate sensitivity for CFA fixed income."

User: "what is tvm"
Rewrite:
"Explain Time Value of Money, present value, future value, discounting, and compounding for CFA Level 1."

Keep rewritten query internal.
Log it only when DEBUG_RAG=true.

9. Grounded answer generation

The chatbot must answer from uploaded documents when context exists.

Prompt rules:
- Use retrieved context as primary source.
- Include source citations.
- Do not invent facts.
- If context is weak, say the uploaded material does not contain enough information.
- Offer a general explanation separately only if useful.

Answer format:
- Direct answer
- Explanation
- Example if relevant
- Sources

10. Source citations

Return source info with answers:

source document title
page number if available
chapter/section if available
chunk id/reference

Frontend should show source cards below the answer.

11. Conversations

Add persistent conversations:

Conversation:
title
userId
createdAt
updatedAt

Message:
conversationId
role: user | assistant | system
content
sources
metadata
createdAt

Features:
- create new chat
- list chats
- open old chat
- save messages
- auto-generate title from first user question
- regenerate assistant answer

12. Feedback

Add feedback persistence:

Fields:
messageId
conversationId
userId
rating: like | dislike
reason
category: hallucinated | too_generic | slow | not_grounded | wrong_source | other
createdAt

13. Chat API

Implement or improve:

POST /api/chat
POST /api/chat/stream
GET /api/conversations
GET /api/conversations/:id
DELETE /api/conversations/:id
POST /api/messages/:id/feedback
POST /api/messages/:id/regenerate

Chat response should include:

answer
conversationId
messageId
sources
debug info only when DEBUG_RAG=true

14. Streaming

Add streaming response support if not present.

Frontend should feel like ChatGPT:
- user sends message
- assistant response streams token by token
- source cards appear after completion

15. Multi-provider LLM abstraction

Create provider abstraction:

llm/
  index.ts
  types.ts
  localProvider.ts
  openaiProvider.ts
  anthropicProvider.ts

embedding/
  index.ts
  types.ts
  localEmbeddingProvider.ts
  openaiEmbeddingProvider.ts

Rules:
- provider chosen by env
- easy to add new provider later
- no provider-specific logic inside route handlers

16. Admin document debugging

Admin should see:
- status
- chunk count
- embedding provider
- created date
- failure reason
- reindex button
- delete button

17. Security and validation

Validate:
- file type
- file size
- authenticated upload
- metadata values
- empty document text
- empty chunks
- no retrieved chunks

18. Testing checklist

After implementation, test:

A. Upload
- upload small PDF
- upload large PDF
- upload invalid file
- upload document with metadata

B. Ingestion
- status becomes processing
- chunks are created
- embeddings generated locally
- chunks stored
- status becomes completed
- failure marks document failed

C. Chat
- ask question from uploaded doc
- answer includes sources
- ask vague question
- query rewrite improves retrieval
- ask unrelated question
- bot does not hallucinate
- old conversation reloads

D. Feedback
- like answer
- dislike answer
- save reason/category

E. Provider switching
- local embeddings work
- OpenAI embeddings still supported
- local LLM works
- OpenAI/Anthropic can be configured later

==================================================
IMPORTANT SAFETY RULES
==================================================

Do not:
- break existing APIs unless migration is clearly handled
- remove current working code without replacement
- hardcode provider keys
- leave documents stuck in processing
- hallucinate answers without retrieved context
- expose debug logs to normal users
- block request forever during large document embedding

==================================================
FINAL OUTPUT REQUIRED
==================================================

After making changes, report:

1. Files changed
2. New files added
3. APIs added/updated
4. Env variables added
5. How RAG flow works now
6. How to test upload
7. How to test chat retrieval
8. Known limitations
9. Next recommended improvements
```

---

## Phase-wise implementation

Do not build everything in one chaotic mega-change. That’s how projects become haunted houses.

### Phase 1: Fix ingestion properly

```txt
local embeddings
batching
timeouts
failed status
debug logs
```

### Phase 2: Improve retrieval

```txt
query rewrite
topK search
score filtering
source citations
```

### Phase 3: ChatGPT-style chat

```txt
saved conversations
streaming
regenerate
copy
feedback
```

### Phase 4: Admin/tutor control

```txt
document status
failed reason
delete
reindex
metadata management
```

### Phase 5: Quality upgrade

```txt
reranking
chapter filters
answer evaluation
analytics
multi-provider polish
```

---


