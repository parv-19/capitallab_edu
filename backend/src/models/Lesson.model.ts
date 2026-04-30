import { Schema, model, models } from "mongoose";

const lessonSchema = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    sectionName: { type: String, required: true },
    title: { type: String, required: true },
    order: { type: Number, required: true },
    videoUrl: { type: String, required: true },
    description: { type: String, required: true },
    resources: [{ type: Schema.Types.ObjectId, ref: "CourseDocument" }],
    duration: { type: String, required: true },
    isFreePreview: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Lesson = models.Lesson || model("Lesson", lessonSchema);
