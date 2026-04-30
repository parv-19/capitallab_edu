import { Schema, model, models } from "mongoose";

const courseDocumentSchema = new Schema(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    name: { type: String, required: true },
    filePath: { type: String, required: true },
    fileType: { type: String, required: true },
    size: { type: Number, required: true },
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
