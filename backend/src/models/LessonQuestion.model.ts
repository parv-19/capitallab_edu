import pool from "../db/pool";
import { buildWhere, FindBuilder, mapRow } from "../db/helpers";

export interface LessonQuestionDoc {
  id: string;
  _id: string;
  lessonId: string;
  userId: string;
  question: string;
  answer?: string | null;
  askedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

function makeDoc(row: any): LessonQuestionDoc {
  return mapRow(row) as LessonQuestionDoc;
}

export const LessonQuestion = {
  find(filter: Record<string, any> = {}): FindBuilder<LessonQuestionDoc> {
    const { where, params } = buildWhere(filter);
    return new FindBuilder(`SELECT * FROM lesson_questions ${where}`, params, makeDoc);
  },

  async create(data: Record<string, any>): Promise<LessonQuestionDoc> {
    const { rows } = await pool.query(
      `INSERT INTO lesson_questions (lesson_id, user_id, question, answer)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [
        data.lessonId ?? data.lesson_id,
        data.userId ?? data.user_id,
        data.question,
        data.answer ?? null,
      ],
    );
    return makeDoc(rows[0]);
  },
};
