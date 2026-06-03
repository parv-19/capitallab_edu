import pool from "../db/pool";
import { buildSet, buildWhere, FindBuilder, mapRow } from "../db/helpers";

export interface LessonDoc {
  id: string;
  _id: string;
  courseId: string;
  sectionName: string;
  title: string;
  order: number;
  videoUrl: string;
  description: string;
  resources: string[];
  duration: string;
  isFreePreview: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function makeDoc(row: any): LessonDoc {
  const d: any = mapRow(row);
  d.resources = d.resources ?? [];
  return d as LessonDoc;
}

export const Lesson = {
  async findById(id: string): Promise<LessonDoc | null> {
    if (!id) return null;
    const { rows } = await pool.query("SELECT * FROM lessons WHERE id=$1", [id]);
    return rows[0] ? makeDoc(rows[0]) : null;
  },

  async findOne(filter: Record<string, any>): Promise<LessonDoc | null> {
    const { where, params } = buildWhere(filter);
    const { rows } = await pool.query(`SELECT * FROM lessons ${where} LIMIT 1`, params);
    return rows[0] ? makeDoc(rows[0]) : null;
  },

  find(filter: Record<string, any> = {}): FindBuilder<LessonDoc> {
    const { where, params } = buildWhere(filter);
    return new FindBuilder(`SELECT * FROM lessons ${where}`, params, makeDoc);
  },

  async create(data: Record<string, any>): Promise<LessonDoc> {
    const fields: Record<string, any> = {
      course_id: data.courseId ?? data.course_id,
      section_name: data.sectionName ?? data.section_name ?? "",
      title: data.title,
      '"order"': data.order ?? 0,
      video_url: data.videoUrl ?? data.video_url ?? "",
      description: data.description ?? "",
      resources: data.resources ?? [],
      duration: data.duration ?? "",
      is_free_preview: data.isFreePreview ?? data.is_free_preview ?? false,
    };
    const cols: string[] = [];
    const vals: string[] = [];
    const params: any[] = [];
    let i = 1;
    for (const [col, val] of Object.entries(fields)) {
      if (val !== undefined) { cols.push(col); vals.push(`$${i++}`); params.push(val); }
    }
    const { rows } = await pool.query(
      `INSERT INTO lessons (${cols.join(",")}) VALUES (${vals.join(",")}) RETURNING *`,
      params,
    );
    return makeDoc(rows[0]);
  },

  async findOneAndUpdate(
    filter: Record<string, any>,
    update: Record<string, any>,
    _opts?: { new?: boolean },
  ): Promise<LessonDoc | null> {
    const { sets, params: setParams } = buildSet(update);
    if (!sets) return this.findOne(filter);
    const { where, params: whereParams } = buildWhere(filter, setParams.length + 1);
    const { rows } = await pool.query(
      `UPDATE lessons SET ${sets} ${where} RETURNING *`,
      [...setParams, ...whereParams],
    );
    return rows[0] ? makeDoc(rows[0]) : null;
  },

  async findByIdAndUpdate(
    id: string,
    update: Record<string, any>,
    _opts?: { new?: boolean },
  ): Promise<LessonDoc | null> {
    const { sets, params } = buildSet(update);
    if (!sets) return this.findById(id);
    params.push(id);
    const { rows } = await pool.query(
      `UPDATE lessons SET ${sets} WHERE id=$${params.length} RETURNING *`,
      params,
    );
    return rows[0] ? makeDoc(rows[0]) : null;
  },

  async findOneAndDelete(filter: Record<string, any>): Promise<LessonDoc | null> {
    const { where, params } = buildWhere(filter);
    const { rows } = await pool.query(`DELETE FROM lessons ${where} RETURNING *`, params);
    return rows[0] ? makeDoc(rows[0]) : null;
  },

  async deleteMany(filter: Record<string, any>): Promise<void> {
    const { where, params } = buildWhere(filter);
    await pool.query(`DELETE FROM lessons ${where}`, params);
  },

  async countDocuments(filter: Record<string, any> = {}): Promise<number> {
    const { where, params } = buildWhere(filter);
    const { rows } = await pool.query(`SELECT COUNT(*) FROM lessons ${where}`, params);
    return parseInt(rows[0].count, 10);
  },
};
