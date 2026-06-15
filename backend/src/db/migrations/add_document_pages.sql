-- Migration: add document_pages table for BM25 page-indexed RAG
-- Run once against an existing database (new installs use schema.sql instead).

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
