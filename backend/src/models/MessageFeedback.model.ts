import pool from "../db/pool";
import { buildWhere, FindBuilder, mapRow } from "../db/helpers";

export interface MessageFeedbackDoc {
  id: string;
  _id: string;
  messageId: string;
  conversationId: string;
  userId: string;
  rating?: "like" | "dislike" | null;
  reason?: string | null;
  category?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function makeDoc(row: any): MessageFeedbackDoc {
  return mapRow(row) as MessageFeedbackDoc;
}

export const MessageFeedback = {
  find(filter: Record<string, any> = {}): FindBuilder<MessageFeedbackDoc> {
    const { where, params } = buildWhere(filter);
    return new FindBuilder(`SELECT * FROM message_feedback ${where}`, params, makeDoc);
  },

  async findOneAndUpdate(
    filter: Record<string, any>,
    update: Record<string, any>,
    _opts?: { upsert?: boolean; new?: boolean; setDefaultsOnInsert?: boolean },
  ): Promise<MessageFeedbackDoc | null> {
    const { where, params: whereParams } = buildWhere(filter);
    const { rows: existing } = await pool.query(
      `SELECT id FROM message_feedback ${where} LIMIT 1`,
      whereParams,
    );

    if (existing.length > 0) {
      const sets: string[] = [];
      const params: any[] = [];
      let i = 1;
      const fields: Record<string, any> = {
        conversation_id: update.conversationId ?? null,
        rating: update.rating ?? null,
        reason: update.reason ?? null,
        category: update.category ?? "other",
      };
      for (const [col, val] of Object.entries(fields)) {
        if (val !== undefined) { sets.push(`${col}=$${i++}`); params.push(val); }
      }
      params.push(existing[0].id);
      const { rows } = await pool.query(
        `UPDATE message_feedback SET ${sets.join(",")} WHERE id=$${i} RETURNING *`,
        params,
      );
      return rows[0] ? makeDoc(rows[0]) : null;
    }

    // upsert
    const { rows } = await pool.query(
      `INSERT INTO message_feedback (message_id,conversation_id,user_id,rating,reason,category)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [
        filter.messageId,
        update.conversationId ?? null,
        filter.userId,
        update.rating ?? null,
        update.reason ?? null,
        update.category ?? "other",
      ],
    );
    return rows[0] ? makeDoc(rows[0]) : null;
  },

  async deleteMany(filter: Record<string, any>): Promise<void> {
    const { where, params } = buildWhere(filter);
    await pool.query(`DELETE FROM message_feedback ${where}`, params);
  },
};
