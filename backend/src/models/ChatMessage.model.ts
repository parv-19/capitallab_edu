import pool from "../db/pool";
import { buildWhere, FindBuilder, mapRow } from "../db/helpers";

export interface ChatMessageDoc {
  id: string;
  _id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  sources: any[];
  metadata: Record<string, any>;
  createdAt: Date;
}

function makeDoc(row: any): ChatMessageDoc {
  const d: any = mapRow(row);
  d.sources = d.sources ?? [];
  d.metadata = d.metadata ?? {};
  return d as ChatMessageDoc;
}

export const ChatMessage = {
  async findById(id: string): Promise<ChatMessageDoc | null> {
    if (!id) return null;
    const { rows } = await pool.query("SELECT * FROM chat_messages WHERE id=$1", [id]);
    return rows[0] ? makeDoc(rows[0]) : null;
  },

  find(filter: Record<string, any> = {}): FindBuilder<ChatMessageDoc> {
    const { where, params } = buildWhere(filter);
    return new FindBuilder(`SELECT * FROM chat_messages ${where}`, params, makeDoc);
  },

  async create(data: Record<string, any>): Promise<ChatMessageDoc> {
    const { rows } = await pool.query(
      `INSERT INTO chat_messages (conversation_id,role,content,sources,metadata)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [
        data.conversationId,
        data.role,
        data.content,
        JSON.stringify(data.sources ?? []),
        JSON.stringify(data.metadata ?? {}),
      ],
    );
    return makeDoc(rows[0]);
  },

  async deleteMany(filter: Record<string, any>): Promise<void> {
    const { where, params } = buildWhere(filter);
    await pool.query(`DELETE FROM chat_messages ${where}`, params);
  },

  // Count messages per conversation
  async countByConversation(
    conversationIds: string[],
  ): Promise<Array<{ conversationId: string; count: number }>> {
    if (conversationIds.length === 0) return [];
    const { rows } = await pool.query(
      `SELECT conversation_id, COUNT(*) AS count
       FROM chat_messages WHERE conversation_id = ANY($1::uuid[])
       GROUP BY conversation_id`,
      [conversationIds],
    );
    return rows.map((r: any) => ({ conversationId: r.conversation_id, count: parseInt(r.count, 10) }));
  },

  // Latest message content per conversation
  async latestByConversation(
    conversationIds: string[],
  ): Promise<Array<{ conversationId: string; content: string }>> {
    if (conversationIds.length === 0) return [];
    const { rows } = await pool.query(
      `SELECT DISTINCT ON (conversation_id) conversation_id, content
       FROM chat_messages WHERE conversation_id = ANY($1::uuid[])
       ORDER BY conversation_id, created_at DESC`,
      [conversationIds],
    );
    return rows.map((r: any) => ({ conversationId: r.conversation_id, content: r.content }));
  },
};
