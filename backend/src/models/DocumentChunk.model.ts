import { Schema, model, models } from "mongoose";

const documentChunkSchema = new Schema(
  {
    documentId: { type: Schema.Types.ObjectId, ref: "CourseDocument", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    subject: { type: String, index: true },
    chapterName: { type: String, index: true },
    filename: { type: String, required: true },
    chunkIndex: { type: Number, required: true },
    pageNumber: { type: Number, default: 1 },
    content: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    embedding: { type: [Number], required: true },
  },
  { timestamps: true },
);

export const DocumentChunk = models.DocumentChunk || model("DocumentChunk", documentChunkSchema);
