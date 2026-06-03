import pool from "../db/pool";
import { FindBuilder, mapRow } from "../db/helpers";

export interface RagChatLogDoc {
  id: string;
  _id: string;
  userId?: string | null;
  question?: string | null;
  answer?: string | null;
  answered: boolean;
  subject?: string | null;
  courseId?: string | null;
  chapterName?: string | null;
  sourcesUsed: any[];
  confidenceScore?: number | null;
  createdAt: Date;
}

function makeDoc(row: any): RagChatLogDoc {
  const d: any = mapRow(row);
  d.sourcesUsed = d.sourcesUsed ?? [];
  return d as RagChatLogDoc;
}

export const RagChatLog = {
  find(_filter: Record<string, any> = {}): FindBuilder<RagChatLogDoc> {
    return new FindBuilder(`SELECT * FROM rag_chat_logs`, [], makeDoc);
  },

  async create(data: Record<string, any>): Promise<RagChatLogDoc> {
    const { rows } = await pool.query(
      `INSERT INTO rag_chat_logs
         (user_id,question,answer,answered,subject,course_id,chapter_name,sources_used,confidence_score)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        data.userId ?? null,
        data.question ?? null,
        data.answer ?? null,
        data.answered ?? false,
        data.subject ?? null,
        data.courseId ?? null,
        data.chapterName ?? null,
        JSON.stringify(data.sourcesUsed ?? []),
        data.confidenceScore ?? null,
      ],
    );
    return makeDoc(rows[0]);
  },
};
