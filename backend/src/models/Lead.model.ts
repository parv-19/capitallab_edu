import { Schema, model, models } from "mongoose";

const leadSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    courseInterest: { type: String, required: true },
    preferredTime: { type: String, required: true },
    message: { type: String },
    status: {
      type: String,
      enum: ["new", "contacted", "visit_scheduled", "enrolled", "closed"],
      default: "new",
    },
    notes: [
      {
        text: { type: String, required: true },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

export const Lead = models.Lead || model("Lead", leadSchema);
