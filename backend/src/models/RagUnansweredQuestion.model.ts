import { Schema, model, models } from "mongoose";

const ragUnansweredQuestionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    question: { type: String, required: true },
    reason: { type: String, required: true },
    subject: { type: String, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", index: true },
    chapterName: { type: String, index: true },
  },
  { timestamps: true },
);

export const RagUnansweredQuestion =
  models.RagUnansweredQuestion || model("RagUnansweredQuestion", ragUnansweredQuestionSchema);
