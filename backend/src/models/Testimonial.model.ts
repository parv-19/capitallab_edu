import { Schema, model, models } from "mongoose";

const testimonialSchema = new Schema(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    studentName: { type: String, required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    review: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved"], default: "pending" },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Testimonial = models.Testimonial || model("Testimonial", testimonialSchema);
