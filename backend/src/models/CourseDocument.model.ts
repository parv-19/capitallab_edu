import { Schema, model, models } from "mongoose";

const courseDocumentSchema = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    courseName: { type: String, trim: true },
    title: { type: String, required: true, trim: true },
    name: { type: String, trim: true },
    originalFileName: { type: String, required: true, trim: true },
    filePath: { type: String, required: true },
    fileUrl: { type: String },
    fileType: { type: String, required: true },
    size: { type: Number, required: true },
    subject: { type: String, trim: true, default: "General" },
    chapterName: { type: String, trim: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["uploaded", "processing", "indexed", "failed"],
      default: "uploaded",
      index: true,
    },
    totalChunks: { type: Number, default: 0 },
    processedForAI: { type: Boolean, default: false },
    chunksCount: { type: Number, default: 0 },
    processingError: { type: String },
    processedAt: { type: Date },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const CourseDocument =
  models.CourseDocument || model("CourseDocument", courseDocumentSchema);
