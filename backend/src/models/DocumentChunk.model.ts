import { Schema, model, models } from "mongoose";

const chunkMetadataSchema = new Schema(
  {
    courseId: { type: String, required: true },
    filename: { type: String, required: true },
    page: { type: Number, required: true },
    reading: { type: String, required: true },
    module: { type: String, required: true },
    los: { type: String, required: true },
    topic: { type: String, required: true },
    section: {
      type: String,
      enum: ["los_statement", "content", "key_concepts", "quiz_question", "answer_key", "formula", "example"],
      required: true,
    },
    chunkIndex: { type: Number, required: true },
    parentChunkId: { type: String },
  },
  { _id: false },
);

const documentChunkSchema = new Schema(
  {
    documentId: { type: Schema.Types.ObjectId, ref: "CourseDocument", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    filename: { type: String, required: true },
    chunkIndex: { type: Number, required: true },
    content: { type: String, required: true },
    metadata: { type: chunkMetadataSchema, required: true },
    embedding: { type: [Number], required: true },
  },
  { timestamps: true },
);

export const DocumentChunk = models.DocumentChunk || model("DocumentChunk", documentChunkSchema);
