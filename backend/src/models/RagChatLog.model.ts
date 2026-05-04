import { Schema, model, models } from "mongoose";

const ragSourceSchema = new Schema(
  {
    documentId: { type: Schema.Types.ObjectId, ref: "CourseDocument" },
    documentTitle: { type: String },
    fileName: { type: String },
    chapterName: { type: String },
    pageNumber: { type: Number },
  },
  { _id: false },
);

const ragChatLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    answered: { type: Boolean, required: true, index: true },
    subject: { type: String, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", index: true },
    chapterName: { type: String, index: true },
    sourcesUsed: { type: [ragSourceSchema], default: [] },
    confidenceScore: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const RagChatLog =
  models.RagChatLog || model("RagChatLog", ragChatLogSchema);
