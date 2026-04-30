import { Schema, model, models } from "mongoose";

const documentChunkSchema = new Schema(
  {
    documentId: { type: Schema.Types.ObjectId, ref: "CourseDocument", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    filename: { type: String, required: true },
    chunkIndex: { type: Number, required: true },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true },
  },
  { timestamps: true },
);

export const DocumentChunk = models.DocumentChunk || model("DocumentChunk", documentChunkSchema);
