import pool from "../db/pool";
import { buildSet, buildWhere, FindBuilder, mapRow } from "../db/helpers";

export interface CourseDoc {
  id: string;
  _id: string;
  title: string;
  slug: string;
  instructor: string;
  description: string;
  shortDescription: string;
  thumbnail?: string | null;
  duration: string;
  level: string;
  status: "draft" | "published";
  createdAt: Date;
  updatedAt: Date;
  toObject(): Omit<CourseDoc, "toObject">;
}

function makeDoc(row: any): CourseDoc {
  const d: any = mapRow(row);
  d.toObject = () => { const { toObject, ...p } = d; return p; };
  return d as CourseDoc;
}

export const Course = {
  async findById(id: string): Promise<CourseDoc | null> {
    if (!id) return null;
    const { rows } = await pool.query("SELECT * FROM courses WHERE id=$1", [id]);
    return rows[0] ? makeDoc(rows[0]) : null;
  },

  async findOne(filter: Record<string, any>): Promise<CourseDoc | null> {
    const { where, params } = buildWhere(filter);
    const { rows } = await pool.query(`SELECT * FROM courses ${where} LIMIT 1`, params);
    return rows[0] ? makeDoc(rows[0]) : null;
  },

  find(filter: Record<string, any> = {}): FindBuilder<CourseDoc> {
    const { where, params } = buildWhere(filter);
    return new FindBuilder(`SELECT * FROM courses ${where}`, params, makeDoc);
  },

  async create(data: Record<string, any>): Promise<CourseDoc> {
    const cols: string[] = [];
    const vals: string[] = [];
    const params: any[] = [];
    const fields: Record<string, any> = {
      title: data.title,
      slug: data.slug,
      instructor: data.instructor,
      description: data.description ?? "",
      short_description: data.shortDescription ?? data.short_description ?? "",
      thumbnail: data.thumbnail ?? null,
      duration: data.duration ?? "",
      level: data.level ?? "",
      status: data.status ?? "draft",
    };
    let i = 1;
    for (const [col, val] of Object.entries(fields)) {
      if (val !== undefined) { cols.push(col); vals.push(`$${i++}`); params.push(val); }
    }
    const { rows } = await pool.query(
      `INSERT INTO courses (${cols.join(",")}) VALUES (${vals.join(",")}) RETURNING *`,
      params,
    );
    return makeDoc(rows[0]);
  },

  async findByIdAndUpdate(
    id: string,
    update: Record<string, any>,
    _opts?: { new?: boolean },
  ): Promise<CourseDoc | null> {
    const { sets, params } = buildSet(update);
    if (!sets) return this.findById(id);
    params.push(id);
    const { rows } = await pool.query(
      `UPDATE courses SET ${sets} WHERE id=$${params.length} RETURNING *`,
      params,
    );
    return rows[0] ? makeDoc(rows[0]) : null;
  },

  async findByIdAndDelete(id: string): Promise<CourseDoc | null> {
    const { rows } = await pool.query("DELETE FROM courses WHERE id=$1 RETURNING *", [id]);
    return rows[0] ? makeDoc(rows[0]) : null;
  },

  async countDocuments(filter: Record<string, any> = {}): Promise<number> {
    const { where, params } = buildWhere(filter);
    const { rows } = await pool.query(`SELECT COUNT(*) FROM courses ${where}`, params);
    return parseInt(rows[0].count, 10);
  },
};
