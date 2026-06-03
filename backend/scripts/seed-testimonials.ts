import "dotenv/config";
import pool from "../src/db/pool";

type SeedTestimonial = {
  studentName: string;
  designation: string;
  courseSlug: string;
  rating: number;
  review: string;
  featured?: boolean;
  status?: "pending" | "approved";
};

const testimonials: SeedTestimonial[] = [
  {
    studentName: "Rishabh Dayama",
    designation: "Capital Lab Education Student",
    courseSlug: "cfa",
    rating: 5,
    review:
      "Truly great faculty. Harsh Sir has in-depth subject knowledge and a highly engaging teaching style. He is focused on practical application and highly committed to students' progress. Excited for Capital Labs!",
    featured: true,
    status: "approved",
  },
  {
    studentName: "Manya Patel",
    designation: "Capital Lab Education Student",
    courseSlug: "cma-us",
    rating: 5,
    review:
      "Harsh Sir, you are truly one of the best teachers. Your guidance is exceptional, and your knowledge is truly inspiring. Your teaching style is so clear that we understand everything in just one explanation. We feel really fortunate and grateful to have you as our mentor.",
    featured: true,
    status: "approved",
  },
  {
    studentName: "Vishal Sharma",
    designation: "CFA Candidate - Capital Lab Education",
    courseSlug: "cfa",
    rating: 5,
    review:
      "I'm really grateful to have you as my CFA mentor. Your ability to simplify complex concepts made a huge difference. It never felt like formal teaching - it felt like guidance from an elder brother who wants you to succeed. Highly recommended for anyone serious about CFA.",
    featured: true,
    status: "approved",
  },
];

async function resolveCourseId(courseSlug: string) {
  const { rows } = await pool.query("SELECT id FROM courses WHERE slug = $1 LIMIT 1", [courseSlug]);
  return rows[0]?.id ?? null;
}

async function upsertTestimonial(testimonial: SeedTestimonial) {
  await pool.query("ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS designation TEXT");

  const courseId = await resolveCourseId(testimonial.courseSlug);

  const existing = await pool.query(
    `SELECT id
     FROM testimonials
     WHERE student_name = $1 AND review = $2
     LIMIT 1`,
    [testimonial.studentName, testimonial.review],
  );

  if (existing.rows[0]?.id) {
    const { rows } = await pool.query(
      `UPDATE testimonials
       SET course_id = $1,
           designation = $2,
           rating = $3,
           status = $4,
           featured = $5,
           updated_at = now()
       WHERE id = $6
       RETURNING id, student_name, designation, rating, status, featured`,
      [
        courseId,
        testimonial.designation,
        testimonial.rating,
        testimonial.status ?? "approved",
        testimonial.featured ?? true,
        existing.rows[0].id,
      ],
    );

    console.log("Updated testimonial:", rows[0]);
    return;
  }

  const { rows } = await pool.query(
    `INSERT INTO testimonials (student_name, designation, course_id, rating, review, status, featured)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, student_name, designation, rating, status, featured`,
    [
      testimonial.studentName,
      testimonial.designation,
      courseId,
      testimonial.rating,
      testimonial.review,
      testimonial.status ?? "approved",
      testimonial.featured ?? true,
    ],
  );

  console.log("Inserted testimonial:", rows[0]);
}

async function seedTestimonials() {
  for (const testimonial of testimonials) {
    await upsertTestimonial(testimonial);
  }

  console.log(`Seeded ${testimonials.length} testimonials.`);
  await pool.end();
}

seedTestimonials().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
