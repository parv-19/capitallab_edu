import pool from "../db/pool";
import { buildSet, buildWhere, FindBuilder, mapRow } from "../db/helpers";

export interface TestimonialDoc {
  id: string;
  _id: string;
  studentId?: string | null;
  studentName?: string | null;
  designation?: string | null;
  courseId?: string | null;
  rating: number;
  review: string;
  status: "pending" | "approved";
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function makeDoc(row: any): TestimonialDoc {
  const d: any = mapRow(row);
  d.featured = d.featured ?? false;
  return d as TestimonialDoc;
}

export const Testimonial = {
  find(filter: Record<string, any> = {}): FindBuilder<TestimonialDoc> {
    const { where, params } = buildWhere(filter);
    return new FindBuilder(`SELECT * FROM testimonials ${where}`, params, makeDoc);
  },

  async create(data: Record<string, any>): Promise<TestimonialDoc> {
    const { rows } = await pool.query(
      `INSERT INTO testimonials (student_id,student_name,designation,course_id,rating,review,status,featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        data.studentId ?? null,
        data.studentName ?? null,
        data.designation ?? null,
        data.courseId ?? null,
        data.rating,
        data.review,
        data.status ?? "pending",
        data.featured ?? false,
      ],
    );
    return makeDoc(rows[0]);
  },

  async findByIdAndUpdate(
    id: string,
    update: Record<string, any>,
    _opts?: { new?: boolean },
  ): Promise<TestimonialDoc | null> {
    const { sets, params } = buildSet(update);
    if (!sets) {
      const { rows } = await pool.query("SELECT * FROM testimonials WHERE id=$1", [id]);
      return rows[0] ? makeDoc(rows[0]) : null;
    }
    params.push(id);
    const { rows } = await pool.query(
      `UPDATE testimonials SET ${sets} WHERE id=$${params.length} RETURNING *`,
      params,
    );
    return rows[0] ? makeDoc(rows[0]) : null;
  },

  async findById(id: string): Promise<(TestimonialDoc & { save(): Promise<void> }) | null> {
    if (!id) return null;
    const { rows } = await pool.query("SELECT * FROM testimonials WHERE id=$1", [id]);
    if (!rows[0]) return null;
    const d: any = makeDoc(rows[0]);
    d.save = async () => {
      await pool.query(`UPDATE testimonials SET featured=$1, status=$2 WHERE id=$3`, [d.featured, d.status, d.id]);
    };
    return d;
  },

  async findByIdAndDelete(id: string): Promise<TestimonialDoc | null> {
    const { rows } = await pool.query("DELETE FROM testimonials WHERE id=$1 RETURNING *", [id]);
    return rows[0] ? makeDoc(rows[0]) : null;
  },

  async countDocuments(filter: Record<string, any> = {}): Promise<number> {
    const { where, params } = buildWhere(filter);
    const { rows } = await pool.query(`SELECT COUNT(*) FROM testimonials ${where}`, params);
    return parseInt(rows[0].count, 10);
  },
};
