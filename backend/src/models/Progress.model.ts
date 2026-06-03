import pool from "../db/pool";
import { buildWhere, FindBuilder, mapRow } from "../db/helpers";

export interface ProgressDoc {
  id: string;
  _id: string;
  userId: string;
  courseId: string;
  completedLessons: string[];
  percentComplete: number;
  lastAccessed: Date;
  createdAt: Date;
  updatedAt: Date;
  save(): Promise<void>;
}

function makeDoc(row: any): ProgressDoc {
  const d: any = mapRow(row);
  d.completedLessons = d.completedLessons ?? [];
  d.save = async () => {
    await pool.query(
      `UPDATE progress SET completed_lessons=$1, percent_complete=$2, last_accessed=$3
       WHERE id=$4`,
      [d.completedLessons, d.percentComplete, d.lastAccessed, d.id],
    );
  };
  return d as ProgressDoc;
}

export const Progress = {
  async findOne(filter: Record<string, any>): Promise<ProgressDoc | null> {
    const { where, params } = buildWhere(filter);
    const { rows } = await pool.query(`SELECT * FROM progress ${where} LIMIT 1`, params);
    return rows[0] ? makeDoc(rows[0]) : null;
  },

  find(filter: Record<string, any> = {}): FindBuilder<ProgressDoc> {
    const { where, params } = buildWhere(filter);
    return new FindBuilder(`SELECT * FROM progress ${where}`, params, makeDoc);
  },

  async create(data: Record<string, any>): Promise<ProgressDoc> {
    const { rows } = await pool.query(
      `INSERT INTO progress (user_id, course_id, completed_lessons, percent_complete, last_accessed)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        data.userId ?? data.user_id,
        data.courseId ?? data.course_id,
        data.completedLessons ?? [],
        data.percentComplete ?? 0,
        data.lastAccessed ?? new Date(),
      ],
    );
    return makeDoc(rows[0]);
  },
};
