import pool from "../db/pool";

export interface DocumentPageDoc {
  id: string;
  documentId: string;
  courseId: string;
  pageNumber: number;
  content: string;
  chapterName?: string | null;
  subject?: string | null;
  metadata: Record<string, any>;
  bm25Score?: number;
}

function makePageDoc(row: any): DocumentPageDoc {
  return {
    id: row.id,
    documentId: row.document_id,
    courseId: row.course_id,
    pageNumber: parseInt(row.page_number, 10),
    content: row.content ?? "",
    chapterName: row.chapter_name ?? null,
    subject: row.subject ?? null,
    metadata: row.metadata ?? {},
    bm25Score: row.bm25_score != null ? parseFloat(row.bm25_score) : undefined,
  };
}

export const DocumentPage = {
  /**
   * BM25 full-text search via PostgreSQL ts_rank_cd (cover-density ranking).
   * queryTerms: space-separated keywords or natural-language phrase.
   * Falls back to an empty result set on any error so the caller can retry
   * with the existing vector/keyword path.
   */
  async bm25Search({
    queryTerms,
    courseIds,
    limit = 8,
    subject,
    chapterName,
  }: {
    queryTerms: string;
    courseIds: string[];
    limit?: number;
    subject?: string;
    chapterName?: string;
  }): Promise<DocumentPageDoc[]> {
    if (!queryTerms.trim() || courseIds.length === 0) return [];

    const conditions: string[] = ["dp.course_id = ANY($2::uuid[])"];
    const qParams: any[] = [queryTerms, courseIds];
    let idx = 3;

    if (subject?.trim()) {
      conditions.push(`dp.subject = $${idx++}`);
      qParams.push(subject.trim());
    }
    if (chapterName?.trim()) {
      conditions.push(`dp.chapter_name = $${idx++}`);
      qParams.push(chapterName.trim());
    }

    qParams.push(limit);

    const sql = `
      SELECT dp.id, dp.document_id, dp.course_id, dp.page_number, dp.content,
             dp.chapter_name, dp.subject, dp.metadata,
             ts_rank_cd(dp.content_tsv, websearch_to_tsquery('english', $1), 32) AS bm25_score
      FROM document_pages dp
      WHERE ${conditions.join(" AND ")}
        AND dp.content_tsv @@ websearch_to_tsquery('english', $1)
      ORDER BY bm25_score DESC
      LIMIT $${idx}
    `;

    try {
      const { rows } = await pool.query(sql, qParams);
      return rows.map(makePageDoc);
    } catch {
      return [];
    }
  },

  /** Fetch specific (documentId, pageNumber) pairs for adjacent-page context. */
  async findAdjacent(
    pairs: Array<{ documentId: string; pageNumber: number }>,
  ): Promise<DocumentPageDoc[]> {
    if (pairs.length === 0) return [];
    const values = pairs
      .map((_, i) => `($${i * 2 + 1}::uuid, $${i * 2 + 2}::int)`)
      .join(", ");
    const params = pairs.flatMap((p) => [p.documentId, p.pageNumber]);
    try {
      const { rows } = await pool.query(
        `SELECT id, document_id, course_id, page_number, content, chapter_name, subject, metadata
         FROM document_pages
         WHERE (document_id, page_number) IN (${values})`,
        params,
      );
      return rows.map(makePageDoc);
    } catch {
      return [];
    }
  },

  async deleteByDocumentId(documentId: string): Promise<void> {
    await pool.query("DELETE FROM document_pages WHERE document_id = $1", [documentId]);
  },

  async insertMany(
    docs: Array<Omit<DocumentPageDoc, "id" | "bm25Score">>,
  ): Promise<void> {
    if (docs.length === 0) return;
    const batchSize = 100;
    for (let start = 0; start < docs.length; start += batchSize) {
      const batch = docs.slice(start, start + batchSize);
      const placeholders: string[] = [];
      const params: any[] = [];
      let i = 1;
      for (const doc of batch) {
        placeholders.push(
          `($${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++})`,
        );
        params.push(
          doc.documentId,
          doc.courseId,
          doc.pageNumber,
          doc.content,
          doc.chapterName ?? null,
          doc.subject ?? null,
          JSON.stringify(doc.metadata ?? {}),
        );
      }
      await pool.query(
        `INSERT INTO document_pages
           (document_id, course_id, page_number, content, chapter_name, subject, metadata)
         VALUES ${placeholders.join(",")}
         ON CONFLICT (document_id, page_number) DO UPDATE
           SET content = EXCLUDED.content,
               chapter_name = EXCLUDED.chapter_name,
               subject = EXCLUDED.subject,
               metadata = EXCLUDED.metadata`,
        params,
      );
    }
  },
};
