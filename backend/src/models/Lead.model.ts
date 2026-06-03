import pool from "../db/pool";
import { buildSet, buildWhere, FindBuilder, mapRow } from "../db/helpers";

export interface LeadDoc {
  id: string;
  _id: string;
  name: string;
  phone: string;
  email?: string | null;
  courseInterest: string;
  preferredTime: string;
  message?: string | null;
  status: "new" | "contacted" | "visit_scheduled" | "enrolled" | "closed";
  notes: Array<{ text: string; addedAt: Date }>;
  createdAt: Date;
  updatedAt: Date;
}

function makeDoc(row: any): LeadDoc {
  const d: any = mapRow(row);
  d.notes = d.notes ?? [];
  return d as LeadDoc;
}

export const Lead = {
  async findById(id: string): Promise<LeadDoc | null> {
    if (!id) return null;
    const { rows } = await pool.query("SELECT * FROM leads WHERE id=$1", [id]);
    return rows[0] ? makeDoc(rows[0]) : null;
  },

  find(filter: Record<string, any> = {}): FindBuilder<LeadDoc> {
    const { where, params } = buildWhere(filter);
    return new FindBuilder(`SELECT * FROM leads ${where}`, params, makeDoc);
  },

  async create(data: Record<string, any>): Promise<LeadDoc> {
    const { rows } = await pool.query(
      `INSERT INTO leads (name,phone,email,course_interest,preferred_time,message,status,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        data.name, data.phone, data.email ?? null,
        data.courseInterest, data.preferredTime,
        data.message ?? null, data.status ?? "new",
        JSON.stringify(data.notes ?? []),
      ],
    );
    return makeDoc(rows[0]);
  },

  async findByIdAndUpdate(
    id: string,
    update: Record<string, any>,
    _opts?: { new?: boolean },
  ): Promise<LeadDoc | null> {
    // Handle $push for notes specially
    if (update.$push?.notes) {
      const { rows } = await pool.query(
        `UPDATE leads SET notes = notes || $1::jsonb WHERE id=$2 RETURNING *`,
        [JSON.stringify([update.$push.notes]), id],
      );
      return rows[0] ? makeDoc(rows[0]) : null;
    }
    const { sets, params } = buildSet(update);
    if (!sets) return this.findById(id);
    params.push(id);
    const { rows } = await pool.query(
      `UPDATE leads SET ${sets} WHERE id=$${params.length} RETURNING *`,
      params,
    );
    return rows[0] ? makeDoc(rows[0]) : null;
  },

  async findByIdAndDelete(id: string): Promise<LeadDoc | null> {
    const { rows } = await pool.query("DELETE FROM leads WHERE id=$1 RETURNING *", [id]);
    return rows[0] ? makeDoc(rows[0]) : null;
  },

  async countDocuments(filter: Record<string, any> = {}): Promise<number> {
    const { where, params } = buildWhere(filter);
    const { rows } = await pool.query(`SELECT COUNT(*) FROM leads ${where}`, params);
    return parseInt(rows[0].count, 10);
  },
};
