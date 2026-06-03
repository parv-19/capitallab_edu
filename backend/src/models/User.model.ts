import pool from "../db/pool";
import { buildSet, buildWhere, FindBuilder, mapRow } from "../db/helpers";

export interface UserDoc {
  id: string;
  _id: string;
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  role: "student" | "admin";
  enrollments: string[];
  avatar?: string | null;
  isBlocked: boolean;
  resetToken?: string | null;
  resetExpiry?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  save(): Promise<void>;
  toObject(): Omit<UserDoc, "save" | "toObject">;
}

function makeDoc(row: any): UserDoc {
  const d: any = mapRow(row);
  d.enrollments = d.enrollments ?? [];
  d.isBlocked = d.isBlocked ?? false;
  d.save = async () => {
    await pool.query(
      `UPDATE users SET name=$1,email=$2,password=$3,phone=$4,role=$5,
       enrollments=$6,avatar=$7,is_blocked=$8,reset_token=$9,reset_expiry=$10
       WHERE id=$11`,
      [d.name, d.email, d.password, d.phone ?? null, d.role,
       d.enrollments, d.avatar ?? null, d.isBlocked,
       d.resetToken ?? null, d.resetExpiry ?? null, d.id],
    );
  };
  d.toObject = () => {
    const { save, toObject, ...plain } = d;
    return plain;
  };
  return d as UserDoc;
}

export const User = {
  async findById(id: string): Promise<UserDoc | null> {
    if (!id) return null;
    const { rows } = await pool.query("SELECT * FROM users WHERE id=$1", [id]);
    return rows[0] ? makeDoc(rows[0]) : null;
  },

  async findOne(filter: Record<string, any>): Promise<UserDoc | null> {
    const { where, params } = buildWhere(filter);
    const { rows } = await pool.query(`SELECT * FROM users ${where} LIMIT 1`, params);
    return rows[0] ? makeDoc(rows[0]) : null;
  },

  find(filter: Record<string, any> = {}): FindBuilder<UserDoc> {
    const { where, params } = buildWhere(filter);
    return new FindBuilder(`SELECT * FROM users ${where}`, params, makeDoc);
  },

  async create(data: Record<string, any>): Promise<UserDoc> {
    const cols: string[] = [];
    const vals: string[] = [];
    const params: any[] = [];
    const fields: Record<string, any> = {
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone ?? null,
      role: data.role ?? "student",
      enrollments: data.enrollments ?? [],
      avatar: data.avatar ?? null,
      is_blocked: data.isBlocked ?? false,
    };
    let i = 1;
    for (const [col, val] of Object.entries(fields)) {
      if (val !== undefined) { cols.push(col); vals.push(`$${i++}`); params.push(val); }
    }
    const { rows } = await pool.query(
      `INSERT INTO users (${cols.join(",")}) VALUES (${vals.join(",")}) RETURNING *`,
      params,
    );
    return makeDoc(rows[0]);
  },

  async findByIdAndUpdate(
    id: string,
    update: Record<string, any>,
    _opts?: { new?: boolean },
  ): Promise<UserDoc | null> {
    const { sets, params } = buildSet(update);
    if (!sets) return this.findById(id);
    params.push(id);
    const { rows } = await pool.query(
      `UPDATE users SET ${sets} WHERE id=$${params.length} RETURNING *`,
      params,
    );
    return rows[0] ? makeDoc(rows[0]) : null;
  },

  async findByIdAndDelete(id: string): Promise<UserDoc | null> {
    const { rows } = await pool.query("DELETE FROM users WHERE id=$1 RETURNING *", [id]);
    return rows[0] ? makeDoc(rows[0]) : null;
  },

  async countDocuments(filter: Record<string, any> = {}): Promise<number> {
    const { where, params } = buildWhere(filter);
    const { rows } = await pool.query(`SELECT COUNT(*) FROM users ${where}`, params);
    return parseInt(rows[0].count, 10);
  },
};
