import pool from "../db/pool";
import { buildWhere, FindBuilder, mapRow } from "../db/helpers";

export interface ChatSessionDoc {
  id: string;
  _id: string;
  userId: string;
  title: string;
  courseIds: string[];
  messages: Array<{ role: "user" | "assistant"; content: string; timestamp: Date }>;
  createdAt: Date;
  updatedAt: Date;
  save(): Promise<void>;
}

function makeDoc(row: any): ChatSessionDoc {
  const d: any = mapRow(row);
  d.courseIds = d.courseIds ?? [];
  d.messages = d.messages ?? [];
  d.save = async () => {
    await pool.query(
      `UPDATE chat_sessions SET title=$1,course_ids=$2,messages=$3 WHERE id=$4`,
      [d.title, d.courseIds, JSON.stringify(d.messages), d.id],
    );
  };
  return d as ChatSessionDoc;
}

export const ChatSession = {
  find(filter: Record<string, any> = {}): FindBuilder<ChatSessionDoc> {
    const { where, params } = buildWhere(filter);
    return new FindBuilder(`SELECT * FROM chat_sessions ${where}`, params, makeDoc);
  },

  async findOne(filter: Record<string, any>): Promise<ChatSessionDoc | null> {
    const { where, params } = buildWhere(filter);
    const { rows } = await pool.query(`SELECT * FROM chat_sessions ${where} LIMIT 1`, params);
    return rows[0] ? makeDoc(rows[0]) : null;
  },

  async create(data: Record<string, any>): Promise<ChatSessionDoc> {
    const { rows } = await pool.query(
      `INSERT INTO chat_sessions (user_id,title,course_ids,messages)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [
        data.userId,
        data.title ?? "New Chat",
        data.courseIds ?? [],
        JSON.stringify(data.messages ?? []),
      ],
    );
    return makeDoc(rows[0]);
  },
};
