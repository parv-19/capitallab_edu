import type { ChatSession, Course, Lead, Testimonial } from "@/types";

export const fallbackCourses: Course[] = [
  {
    _id: "course-1",
    title: "Foundation Commerce Excellence",
    slug: "foundation-commerce-excellence",
    instructor: "Prof. Ritesh Shah",
    description:
      "A structured offline coaching journey covering fundamentals, test strategy, and mentor-led concept reinforcement for ambitious commerce students.",
    shortDescription:
      "Premium offline coaching for commerce fundamentals with personal attention and exam readiness.",
    thumbnail:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
    duration: "10 months",
    level: "Intermediate",
    status: "published",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "course-2",
    title: "Advanced Accounts Mastery",
    slug: "advanced-accounts-mastery",
    instructor: "CA Meera Vyas",
    description:
      "An outcome-focused batch for advanced accounts, revision loops, doubt support, and disciplined preparation in Ahmedabad.",
    shortDescription:
      "Advanced coaching for accounts with rigorous revision, practice, and faculty support.",
    thumbnail:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
    duration: "8 months",
    level: "Advanced",
    status: "published",
    createdAt: new Date().toISOString(),
  },
];

export const fallbackTestimonials: Testimonial[] = [
  {
    _id: "testimonial-1",
    studentId: "",
    studentName: "Aarav Patel",
    rating: 5,
    review: "The mentors here made difficult concepts feel surprisingly manageable and personal.",
    featured: true,
    status: "approved",
    courseId: "course-1",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "testimonial-2",
    studentId: "",
    studentName: "Khushi Shah",
    rating: 5,
    review: "Strong discipline, clear teaching, and constant feedback helped my confidence grow fast.",
    featured: true,
    status: "approved",
    courseId: "course-2",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "testimonial-3",
    studentId: "",
    studentName: "Vivaan Desai",
    rating: 5,
    review: "It feels premium but still very supportive. The faculty genuinely know every student.",
    featured: true,
    status: "approved",
    courseId: "course-1",
    createdAt: new Date().toISOString(),
  },
];

export const fallbackLeads: Lead[] = [
  {
    _id: "lead-1",
    name: "Nikita Soni",
    phone: "9876543210",
    email: "nikita@example.com",
    courseInterest: "Foundation Commerce Excellence",
    preferredTime: "Evening 5-8",
    status: "new",
    createdAt: new Date().toISOString(),
  },
];

export const fallbackChatSessions: ChatSession[] = [
  {
    _id: "chat-1",
    title: "Summarise Chapter 1",
    courseIds: ["course-1"],
    createdAt: new Date().toISOString(),
    messages: [
      {
        role: "assistant",
        content: "Ask me anything from your enrolled course material and I will guide you step by step.",
        timestamp: new Date().toISOString(),
      },
    ],
  },
];
