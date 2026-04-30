import { Schema, model, models } from "mongoose";

const courseSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    instructor: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    shortDescription: { type: String, required: true },
    thumbnail: { type: String, required: false },
    duration: { type: String, required: true },
    level: { type: String, required: true },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
  },
  { timestamps: true },
);

export const Course = models.Course || model("Course", courseSchema);
