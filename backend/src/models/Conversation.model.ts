import pool from "../db/pool";
import { buildWhere, FindBuilder, mapRow } from "../db/helpers";

export interface ConversationDoc {
  id: string;
  _id: string;
  userId: string;
  title?: string | null;
  courseIds: string[];
  subject?: string | null;
  chapterName?: string | null;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
  save(): Promise<void>;
}

function makeDoc(row: any): ConversationDoc {
  const d: any = mapRow(row);
  d.courseIds = d.courseIds ?? [];
  d.save = async () => {
    await pool.query(
      `UPDATE conversations SET title=$1,course_ids=$2,subject=$3,chapter_name=$4,last_message_at=$5
       WHERE id=$6`,
      [d.title ?? null, d.courseIds, d.subject ?? null, d.chapterName ?? null, d.lastMessageAt, d.id],
    );
  };
  return d as ConversationDoc;
}

export const Conversation = {
  async findById(id: string): Promise<ConversationDoc | null> {
    if (!id) return null;
    const { rows } = await pool.query("SELECT * FROM conversations WHERE id=$1", [id]);
    return rows[0] ? makeDoc(rows[0]) : null;
  },

  async findOne(filter: Record<string, any>): Promise<ConversationDoc | null> {
    const { where, params } = buildWhere(filter);
    const { rows } = await pool.query(`SELECT * FROM conversations ${where} LIMIT 1`, params);
    return rows[0] ? makeDoc(rows[0]) : null;
  },

  find(filter: Record<string, any> = {}): FindBuilder<ConversationDoc> {
    const { where, params } = buildWhere(filter);
    return new FindBuilder(`SELECT * FROM conversations ${where}`, params, makeDoc);
  },

  async create(data: Record<string, any>): Promise<ConversationDoc> {
    const { rows } = await pool.query(
      `INSERT INTO conversations (user_id,title,course_ids,subject,chapter_name,last_message_at)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [
        data.userId,
        data.title ?? null,
        data.courseIds ?? [],
        data.subject ?? null,
        data.chapterName ?? null,
        data.lastMessageAt ?? new Date(),
      ],
    );
    return makeDoc(rows[0]);
  },

  async findOneAndDelete(filter: Record<string, any>): Promise<ConversationDoc | null> {
    const { where, params } = buildWhere(filter);
    const { rows } = await pool.query(`DELETE FROM conversations ${where} RETURNING *`, params);
    return rows[0] ? makeDoc(rows[0]) : null;
  },
};
