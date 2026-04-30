import { Schema, model, models, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, trim: true },
    role: { type: String, enum: ["student", "admin"], default: "student" },
    enrollments: [{ type: Schema.Types.ObjectId, ref: "Course" }],
    avatar: { type: String },
    isBlocked: { type: Boolean, default: false },
    resetToken: { type: String },
    resetExpiry: { type: Date },
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof userSchema>;
export const User = models.User || model("User", userSchema);
