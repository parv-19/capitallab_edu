import { Schema, model, models } from "mongoose";

const lessonQuestionSchema = new Schema(
  {
    lessonId: { type: Schema.Types.ObjectId, ref: "Lesson", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    question: { type: String, required: true },
    answer: { type: String },
    askedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const LessonQuestion =
  models.LessonQuestion || model("LessonQuestion", lessonQuestionSchema);
