-- ============================================================
-- Capital Lab Education — Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor (Project → SQL Editor)
-- ============================================================

-- Enable pgvector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ── Users ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  password        TEXT NOT NULL,
  phone           TEXT,
  role            TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  enrollments     UUID[] NOT NULL DEFAULT '{}',
  avatar          TEXT,
  is_blocked      BOOLEAN NOT NULL DEFAULT false,
  reset_token     TEXT,
  reset_expiry    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users (role);

-- ── Courses ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  slug              TEXT UNIQUE NOT NULL,
  instructor        TEXT NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  short_description TEXT NOT NULL DEFAULT '',
  thumbnail         TEXT,
  duration          TEXT NOT NULL DEFAULT '',
  level             TEXT NOT NULL DEFAULT '',
  status            TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_courses_slug   ON courses (slug);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses (status);

-- ── Lessons ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lessons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  section_name    TEXT NOT NULL DEFAULT '',
  title           TEXT NOT NULL,
  "order"         INTEGER NOT NULL DEFAULT 0,
  video_url       TEXT NOT NULL DEFAULT '',
  description     TEXT NOT NULL DEFAULT '',
  resources       UUID[] NOT NULL DEFAULT '{}',
  duration        TEXT NOT NULL DEFAULT '',
  is_free_preview BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON lessons (course_id);

-- ── Progress ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS progress (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id         UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  completed_lessons UUID[] NOT NULL DEFAULT '{}',
  percent_complete  NUMERIC(5,2) NOT NULL DEFAULT 0,
  last_accessed     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- ── Lesson Questions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lesson_questions (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question  TEXT NOT NULL,
  answer    TEXT,
  asked_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lesson_questions_lesson ON lesson_questions (lesson_id);

-- ── Course Documents ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS course_documents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id           UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  course_name         TEXT,
  title               TEXT NOT NULL,
  name                TEXT,
  original_name       TEXT,
  original_file_name  TEXT NOT NULL,
  mime_type           TEXT,
  file_path           TEXT NOT NULL,
  file_url            TEXT,
  file_type           TEXT NOT NULL,
  size                INTEGER NOT NULL DEFAULT 0,
  subject             TEXT NOT NULL DEFAULT 'General',
  chapter             TEXT,
  chapter_name        TEXT,
  level               TEXT,
  tags                TEXT[] NOT NULL DEFAULT '{}',
  uploaded_by         UUID REFERENCES users(id),
  status              TEXT NOT NULL DEFAULT 'uploaded'
                        CHECK (status IN ('uploaded','processing','completed','indexed','failed')),
  chunk_count         INTEGER NOT NULL DEFAULT 0,
  total_chunks        INTEGER NOT NULL DEFAULT 0,
  chunks_count        INTEGER NOT NULL DEFAULT 0,
  processed_for_ai    BOOLEAN NOT NULL DEFAULT false,
  embedding_provider  TEXT,
  error_message       TEXT,
  processing_error    TEXT,
  processed_at        TIMESTAMPTZ,
  uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_course_documents_course_id ON course_documents (course_id);
CREATE INDEX IF NOT EXISTS idx_course_documents_status   ON course_documents (status);

-- ── Document Chunks (pgvector) ───────────────────────────────
CREATE TABLE IF NOT EXISTS document_chunks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   UUID NOT NULL REFERENCES course_documents(id) ON DELETE CASCADE,
  course_id     UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  course        TEXT,
  subject       TEXT,
  chapter       TEXT,
  chapter_name  TEXT,
  tags          TEXT[] NOT NULL DEFAULT '{}',
  filename      TEXT NOT NULL,
  chunk_index   INTEGER NOT NULL DEFAULT 0,
  page_number   INTEGER NOT NULL DEFAULT 1,
  section_title TEXT,
  text          TEXT NOT NULL,
  content       TEXT NOT NULL,
  token_count   INTEGER NOT NULL DEFAULT 0,
  metadata      JSONB NOT NULL DEFAULT '{}',
  embedding     vector(1536),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chunks_course_id    ON document_chunks (course_id);
CREATE INDEX IF NOT EXISTS idx_chunks_document_id  ON document_chunks (document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_subject      ON document_chunks (subject);
CREATE INDEX IF NOT EXISTS idx_chunks_chapter_name ON document_chunks (chapter_name);

-- HNSW index for fast approximate nearest-neighbour vector search
-- (better recall than IVFFlat; no training required)
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw
  ON document_chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ── RAG Chat Logs ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rag_chat_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id) ON DELETE SET NULL,
  question         TEXT,
  answer           TEXT,
  answered         BOOLEAN NOT NULL DEFAULT false,
  subject          TEXT,
  course_id        UUID,
  chapter_name     TEXT,
  sources_used     JSONB NOT NULL DEFAULT '[]',
  confidence_score NUMERIC(6,4),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rag_logs_user_id ON rag_chat_logs (user_id);

-- ── RAG Unanswered Questions ─────────────────────────────────
CREATE TABLE IF NOT EXISTS rag_unanswered_questions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  question     TEXT,
  reason       TEXT,
  subject      TEXT,
  course_id    UUID,
  chapter_name TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Conversations ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           TEXT,
  course_ids      UUID[] NOT NULL DEFAULT '{}',
  subject         TEXT,
  chapter_name    TEXT,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id        ON conversations (user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message   ON conversations (last_message_at DESC);

-- ── Chat Messages ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content         TEXT NOT NULL,
  sources         JSONB NOT NULL DEFAULT '[]',
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages (conversation_id);

-- ── Message Feedback ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS message_feedback (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id      UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating          TEXT CHECK (rating IN ('like','dislike')),
  reason          TEXT,
  category        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- ── Leads ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  phone           TEXT NOT NULL,
  email           TEXT,
  course_interest TEXT NOT NULL,
  preferred_time  TEXT NOT NULL,
  message         TEXT,
  status          TEXT NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new','contacted','visit_scheduled','enrolled','closed')),
  notes           JSONB NOT NULL DEFAULT '[]',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Testimonials ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS testimonials (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  student_name TEXT,
  designation  TEXT,
  course_id    UUID REFERENCES courses(id) ON DELETE SET NULL,
  rating       INTEGER CHECK (rating BETWEEN 1 AND 5),
  review       TEXT,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved')),
  featured     BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Document Pages (page-indexed BM25 RAG) ──────────────────
-- One row per physical page; content_tsv is auto-maintained by trigger.
CREATE TABLE IF NOT EXISTS document_pages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   UUID NOT NULL REFERENCES course_documents(id) ON DELETE CASCADE,
  course_id     UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  page_number   INTEGER NOT NULL,
  content       TEXT NOT NULL,
  content_tsv   TSVECTOR,
  chapter_name  TEXT,
  subject       TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, page_number)
);
CREATE INDEX IF NOT EXISTS idx_document_pages_tsv    ON document_pages USING GIN(content_tsv);
CREATE INDEX IF NOT EXISTS idx_document_pages_doc    ON document_pages (document_id);
CREATE INDEX IF NOT EXISTS idx_document_pages_course ON document_pages (course_id);

-- keep content_tsv in sync automatically
CREATE OR REPLACE FUNCTION document_pages_tsv_update() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.content_tsv := to_tsvector('english', coalesce(NEW.content, ''));
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_document_pages_tsv ON document_pages;
CREATE TRIGGER trg_document_pages_tsv
  BEFORE INSERT OR UPDATE OF content ON document_pages
  FOR EACH ROW EXECUTE FUNCTION document_pages_tsv_update();

-- ── Chat Sessions (legacy) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT,
  course_ids UUID[] NOT NULL DEFAULT '{}',
  messages   JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions (user_id);

-- ── updated_at trigger (applies to all tables with that column) ──
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT table_name FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name = 'updated_at'
    GROUP BY table_name
  LOOP
    EXECUTE format(
      'CREATE OR REPLACE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      tbl, tbl
    );
  END LOOP;
END;
$$;
