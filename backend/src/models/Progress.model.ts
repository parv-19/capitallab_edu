import { Schema, model, models } from "mongoose";

const progressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    completedLessons: [{ type: Schema.Types.ObjectId, ref: "Lesson" }],
    percentComplete: { type: Number, default: 0 },
    lastAccessed: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const Progress = models.Progress || model("Progress", progressSchema);
