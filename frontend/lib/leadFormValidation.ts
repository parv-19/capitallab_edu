import { z } from "zod";

const NAME_REGEX = /^[A-Za-z]+(\s[A-Za-z]+){1,2}$/;
const PHONE_REGEX = /^[0-9]{10}$/;

export function capitalizeWords(value: string) {
  return value
    .replace(/\s+/g, " ")
    .trimStart()
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word))
    .join(" ");
}

export function sanitizeName(value: string) {
  return capitalizeWords(value.replace(/[^A-Za-z\s]/g, ""));
}

export function sanitizePhone(value: string) {
  return value.replace(/\D/g, "").slice(0, 10);
}

export function sanitizeEmail(value: string) {
  return value.replace(/\s/g, "").toLowerCase();
}

export const leadFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .regex(NAME_REGEX, "Enter 2-3 words, letters only"),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .regex(PHONE_REGEX, "Enter a valid 10-digit phone number"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  courseInterest: z.string().trim().min(1, "Please select a program"),
  preferredTime: z.string().trim().min(1, "Please select a preferred time"),
  message: z.string().trim().optional(),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;
export type LeadFormField = keyof LeadFormValues;

export function validateLeadFormField(field: LeadFormField, value: string) {
  const fieldSchema = leadFormSchema.shape[field];
  const result = fieldSchema.safeParse(value);
  return result.success ? "" : (result.error.issues[0]?.message ?? "Invalid value");
}

// lp-cfa landing page forms have no message field.
export const cfaLeadFormSchema = leadFormSchema.omit({ message: true });

export type CfaLeadFormValues = z.infer<typeof cfaLeadFormSchema>;
export type CfaLeadFormField = keyof CfaLeadFormValues;

export function validateCfaLeadFormField(field: CfaLeadFormField, value: string) {
  const fieldSchema = cfaLeadFormSchema.shape[field];
  const result = fieldSchema.safeParse(value);
  return result.success ? "" : (result.error.issues[0]?.message ?? "Invalid value");
}
