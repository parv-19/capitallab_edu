import pool from "../db/pool";
import { FindBuilder, mapRow } from "../db/helpers";

export interface RagUnansweredQuestionDoc {
  id: string;
  _id: string;
  userId?: string | null;
  question: string;
  reason: string;
  subject?: string | null;
  courseId?: string | null;
  chapterName?: string | null;
  createdAt: Date;
}

function makeDoc(row: any): RagUnansweredQuestionDoc {
  return mapRow(row) as RagUnansweredQuestionDoc;
}

export const RagUnansweredQuestion = {
  find(_filter: Record<string, any> = {}): FindBuilder<RagUnansweredQuestionDoc> {
    return new FindBuilder(`SELECT * FROM rag_unanswered_questions`, [], makeDoc);
  },

  async create(data: Record<string, any>): Promise<RagUnansweredQuestionDoc> {
    const { rows } = await pool.query(
      `INSERT INTO rag_unanswered_questions (user_id,question,reason,subject,course_id,chapter_name)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [
        data.userId ?? null,
        data.question,
        data.reason ?? "not_found",
        data.subject ?? null,
        data.courseId ?? null,
        data.chapterName ?? null,
      ],
    );
    return makeDoc(rows[0]);
  },
};
