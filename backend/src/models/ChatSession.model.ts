import { Schema, model, models } from "mongoose";

const chatMessageSchema = new Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
);

const chatSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    courseIds: [{ type: Schema.Types.ObjectId, ref: "Course" }],
    messages: [chatMessageSchema],
  },
  { timestamps: true },
);

export const ChatSession = models.ChatSession || model("ChatSession", chatSessionSchema);
