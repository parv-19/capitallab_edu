import pool from "../db/pool";
import { buildWhere, FindBuilder, mapRow } from "../db/helpers";

export interface DocumentChunkDoc {
  id: string;
  _id: string;
  documentId: string;
  courseId: string;
  course?: string | null;
  subject?: string | null;
  chapter?: string | null;
  chapterName?: string | null;
  tags: string[];
  filename: string;
  chunkIndex: number;
  pageNumber: number;
  sectionTitle?: string | null;
  text: string;
  content: string;
  tokenCount: number;
  metadata: Record<string, any>;
  embedding?: number[];
  createdAt: Date;
}

function makeDoc(row: any): DocumentChunkDoc {
  const d: any = mapRow(row);
  d.tags = d.tags ?? [];
  d.metadata = d.metadata ?? {};
  return d as DocumentChunkDoc;
}

export const DocumentChunk = {
  async findById(id: string): Promise<DocumentChunkDoc | null> {
    if (!id) return null;
    const { rows } = await pool.query(
      "SELECT * FROM document_chunks WHERE id=$1",
      [id],
    );
    return rows[0] ? makeDoc(rows[0]) : null;
  },

  async findOne(filter: Record<string, any>): Promise<DocumentChunkDoc | null> {
    const { where, params } = buildWhere(filter);
    const { rows } = await pool.query(
      `SELECT * FROM document_chunks ${where} LIMIT 1`,
      params,
    );
    return rows[0] ? makeDoc(rows[0]) : null;
  },

  find(filter: Record<string, any> = {}): FindBuilder<DocumentChunkDoc> {
    const { where, params } = buildWhere(filter);
    return new FindBuilder(
      `SELECT id,document_id,course_id,course,subject,chapter,chapter_name,
              tags,filename,chunk_index,page_number,section_title,text,content,
              token_count,metadata,created_at FROM document_chunks ${where}`,
      params,
      makeDoc,
    );
  },

  async insertMany(docs: Record<string, any>[]): Promise<void> {
    if (docs.length === 0) return;

    const batchSize = 50;
    for (let start = 0; start < docs.length; start += batchSize) {
      const batch = docs.slice(start, start + batchSize);
      const valuePlaceholders: string[] = [];
      const params: any[] = [];
      let i = 1;

      for (const doc of batch) {
        valuePlaceholders.push(
          `($${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},` +
          `$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++}::vector)`,
        );
        params.push(
          doc.documentId,
          doc.courseId,
          doc.course ?? null,
          doc.subject ?? null,
          doc.chapter ?? null,
          doc.chapterName ?? null,
          doc.tags ?? [],
          doc.filename,
          doc.chunkIndex,
          doc.pageNumber ?? 1,
          doc.sectionTitle ?? null,
          doc.text,
          doc.content,
          doc.tokenCount ?? 0,
          JSON.stringify(doc.metadata ?? {}),
          JSON.stringify(doc.embedding ?? []),
        );
      }

      await pool.query(
        `INSERT INTO document_chunks
           (document_id,course_id,course,subject,chapter,chapter_name,tags,filename,
            chunk_index,page_number,section_title,text,content,token_count,metadata,embedding)
         VALUES ${valuePlaceholders.join(",")}`,
        params,
      );
    }
  },

  async deleteMany(filter: Record<string, any>): Promise<void> {
    const { where, params } = buildWhere(filter);
    await pool.query(`DELETE FROM document_chunks ${where}`, params);
  },

  // Vector similarity search (cosine) using pgvector
  async vectorSearch(params: {
    queryEmbedding: number[];
    courseIds: string[];
    numCandidates?: number;
    limit?: number;
    subject?: string | null;
    chapterName?: string | null;
  }): Promise<DocumentChunkDoc[]> {
    const {
      queryEmbedding,
      courseIds,
      limit = 24,
      subject,
      chapterName,
    } = params;

    const conditions: string[] = ["course_id = ANY($2::uuid[])"];
    const qParams: any[] = [JSON.stringify(queryEmbedding), courseIds];
    let idx = 3;

    if (subject?.trim()) {
      conditions.push(`subject = $${idx++}`);
      qParams.push(subject.trim());
    }
    if (chapterName?.trim()) {
      conditions.push(`chapter_name = $${idx++}`);
      qParams.push(chapterName.trim());
    }

    const where = `WHERE ${conditions.join(" AND ")}`;
    const sql = `
      SELECT id, document_id, course_id, course, subject, chapter, chapter_name,
             tags, filename, chunk_index, page_number, section_title, text, content,
             token_count, metadata,
             1 - (embedding <=> $1::vector) AS score
      FROM document_chunks
      ${where}
      ORDER BY embedding <=> $1::vector
      LIMIT $${idx}
    `;
    qParams.push(limit);

    const { rows } = await pool.query(sql, qParams);
    return rows.map((r: any) => {
      const d = makeDoc(r);
      (d as any).score = parseFloat(r.score ?? "0");
      return d;
    });
  },

  // Keyword / lexical search
  async keywordSearch(params: {
    keywords: string[];
    courseIds: string[];
    limit?: number;
    subject?: string | null;
    chapterName?: string | null;
  }): Promise<DocumentChunkDoc[]> {
    const { keywords, courseIds, limit = 40, subject, chapterName } = params;
    if (keywords.length === 0) return [];

    const pattern = keywords.map((k) => `%${k}%`).join("|");
    const conditions: string[] = ["course_id = ANY($1::uuid[])"];
    const qParams: any[] = [courseIds];
    let idx = 2;

    if (subject?.trim()) {
      conditions.push(`subject = $${idx++}`);
      qParams.push(subject.trim());
    }
    if (chapterName?.trim()) {
      conditions.push(`chapter_name = $${idx++}`);
      qParams.push(chapterName.trim());
    }

    const keywordConds = keywords.map((kw) => {
      qParams.push(`%${kw}%`);
      const p = `$${idx++}`;
      return `(content ILIKE ${p} OR metadata->>'topic' ILIKE ${p} OR section_title ILIKE ${p})`;
    });
    conditions.push(`(${keywordConds.join(" OR ")})`);

    const where = `WHERE ${conditions.join(" AND ")}`;
    const { rows } = await pool.query(
      `SELECT id, document_id, course_id, course, subject, chapter, chapter_name,
              tags, filename, chunk_index, page_number, section_title, text, content,
              token_count, metadata
       FROM document_chunks ${where} LIMIT $${idx}`,
      [...qParams, limit],
    );
    return rows.map(makeDoc);
  },

  // Fetch adjacent chunks by (documentId, chunkIndex) pairs
  async findAdjacentChunks(
    pairs: Array<{ documentId: string; chunkIndex: number }>,
  ): Promise<DocumentChunkDoc[]> {
    if (pairs.length === 0) return [];
    const conditions = pairs.map((_, i) => `(document_id=$${i * 2 + 1} AND chunk_index=$${i * 2 + 2})`);
    const params = pairs.flatMap((p) => [p.documentId, p.chunkIndex]);
    const { rows } = await pool.query(
      `SELECT id, document_id, course_id, course, subject, chapter, chapter_name,
              tags, filename, chunk_index, page_number, section_title, text, content,
              token_count, metadata
       FROM document_chunks WHERE ${conditions.join(" OR ")}`,
      params,
    );
    return rows.map(makeDoc);
  },
};
