export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: "student" | "admin";
  avatar?: string;
  enrollments?: Course[];
}

export interface Course {
  _id: string;
  title: string;
  slug: string;
  instructor: string;
  description: string;
  shortDescription: string;
  thumbnail: string;
  duration: string;
  level: string;
  status: "draft" | "published";
  createdAt: string;
  lessons?: Lesson[];
  testimonials?: Testimonial[];
}

export interface Lesson {
  _id: string;
  courseId: string;
  sectionName: string;
  title: string;
  order: number;
  videoUrl: string;
  description: string;
  duration: string;
  isFreePreview: boolean;
}

export interface Lead {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  courseInterest: string;
  preferredTime: string;
  message?: string;
  status: "new" | "contacted" | "visit_scheduled" | "enrolled" | "closed";
  createdAt: string;
}

export interface Testimonial {
  _id: string;
  studentId: string;
  studentName: string;
  rating: number;
  review: string;
  featured: boolean;
  status: "pending" | "approved";
  courseId: string;
  createdAt: string;
}

export interface CourseDocument {
  _id: string;
  name: string;
  title?: string;
  originalFileName?: string;
  filePath: string;
  fileType: string;
  size: number;
  status?: "uploaded" | "processing" | "completed" | "indexed" | "failed";
  processedForAI: boolean;
  chunkCount?: number;
  chunksCount: number;
  embeddingProvider?: string;
  errorMessage?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatSession {
  _id: string;
  title: string;
  courseIds: string[];
  messages: ChatMessage[];
  createdAt: string;
}

export interface Enrollment {
  courseId: string;
  percentComplete: number;
}
