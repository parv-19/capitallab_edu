import type { Course, Testimonial } from "@/types";

export interface MarketingCourse extends Course {
  badge: string;
  fullTitle: string;
  highlights: string[];
}

export interface CourseLesson {
  _id: string;
  sectionName: string;
  title: string;
  duration: string;
  isFreePreview: boolean;
  order: number;
}

export interface CourseDetailContent {
  title: string;
  instructor: string;
  duration: string;
  level: string;
  shortDescription: string;
  description: string;
  lessons: CourseLesson[];
}

export const companyInfo = {
  name: "Capital Lab Education",
  shortName: "Capital Lab",
  eyebrow: "Professional Finance Certification Coaching",
  heroTitle: "Your Gateway to Global Finance Credentials",
  heroHighlight: "Finance Credentials",
  heroDescription:
    "Expert-led coaching for CMA US and CFA, designed to help finance professionals achieve internationally recognized qualifications and elevate their careers.",
  heroPrimaryCta: "Explore Our Programs",
  heroSecondaryCta: "Talk to an Advisor",
  aboutDescription:
    "Capital Lab Education is a specialized coaching institute focused exclusively on professional finance certifications. We combine deep industry expertise with structured, exam-focused learning, helping working professionals and students crack globally recognized credentials with confidence.",
  aboutHeadline: "Built for Finance Professionals Who Aim Higher",
  contactHeadline: "Start Your Journey Today",
  contactDescription:
    "Have questions about which program suits you? Our team is happy to guide you through the options and help you pick the right path.",
  tagline:
    "Empowering finance professionals with globally recognized certifications.",
  location: "201, Grace Business Park, Opp. Sagar Sangeeta 1, Nr. Saral Heights, Kargil Petrol Pump Road, Sola, Ahmedabad - 380060",
  mapUrl: "https://maps.app.goo.gl/AxJ5WBfUasPNfb9a6",
  phoneDisplay: "+91 63552 58396",
  phoneHref: "tel:+916355258396",
  email: "info@capitallabedu.com",
  officeHours: "Monday - Sunday, 10:00 AM - 7:30 PM",
  whatsappHref: "https://wa.me/916355258396",
};

export const stats = [
  { value: "10+", label: "Years of expertise", numericValue: 10, suffix: "+" },
  { value: "500+", label: "Students trained", numericValue: 500, suffix: "+" },
  { value: "2", label: "Global certifications", numericValue: 2, suffix: "" },
  { value: "95%", label: "Student satisfaction", numericValue: 95, suffix: "%" },
];

export const aboutPillars = [
  {
    title: "Exam-Focused Curriculum",
    description:
      "Every session is structured around the actual exam pattern. No fluff - just concepts, practice, and strategy that matter on test day.",
  },
  {
    title: "Small Batch Coaching",
    description:
      "We keep batches small to ensure every student gets personal attention, doubt resolution, and mentorship throughout their preparation.",
  },
  {
    title: "Real-World Relevance",
    description:
      "Our instructor brings live industry experience in equity research, credit analysis, and financial modeling, so learning goes beyond textbooks.",
  },
  {
    title: "Online and Offline Options",
    description:
      "Flexible learning modes to suit your schedule. Whether you're a full-time professional or a recent graduate, we fit around your life.",
  },
];

export const marketingCourses: MarketingCourse[] = [
  {
    _id: "course-cma-us",
    title: "CMA US",
    slug: "cma-us",
    instructor: "Harsh Trivedi",
    description:
      "The CMA US is the world's leading management accounting certification, offered by the Institute of Management Accountants. It validates your skills in financial planning, analysis, control, and decision support.",
    shortDescription:
      "A globally respected management accounting qualification for finance professionals aiming for planning, analysis, and strategic leadership roles.",
    thumbnail:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80",
    duration: "Two-part exam support",
    level: "Professional",
    status: "published",
    createdAt: new Date().toISOString(),
    badge: "IMA Certified",
    fullTitle: "Certified Management Accountant (USA)",
    highlights: [
      "Covers Financial Planning, Performance and Analytics",
      "Strategic Financial Management focus",
      "Globally accepted in 100+ countries",
      "Ideal for Finance Managers, Controllers and CFOs",
      "Two-part exam with comprehensive support",
    ],
  },
  {
    _id: "course-cfa",
    title: "CFA",
    slug: "cfa",
    instructor: "Harsh Trivedi",
    description:
      "The CFA designation is the gold standard in investment analysis and portfolio management. Offered by the CFA Institute, it is among the most respected credentials in global capital markets.",
    shortDescription:
      "A premier investment credential built for candidates pursuing equity research, portfolio management, valuation, and capital markets roles.",
    thumbnail:
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80",
    duration: "Level-based preparation",
    level: "Professional",
    status: "published",
    createdAt: new Date().toISOString(),
    badge: "CFA Institute",
    fullTitle: "Chartered Financial Analyst",
    highlights: [
      "Covers Investment Tools, Asset Classes and Portfolio Management",
      "Three progressive levels (L1 to L3)",
      "Recognized by top banks, funds and research firms",
      "Instructor cleared CFA Level 2",
      "Specialized focus on equity and fixed income valuation",
    ],
  },
];

export const courseDetails: Record<string, CourseDetailContent> = {
  "cma-us": {
    title: "CMA US",
    instructor: "Harsh Trivedi",
    duration: "Two-part exam support",
    level: "Professional",
    shortDescription:
      "A globally respected management accounting qualification for finance professionals aiming for planning, analysis, and strategic leadership roles.",
    description:
      "Our CMA US coaching is built around the two-part exam structure and combines concept clarity, question practice, and exam strategy. Students get structured guidance across financial planning, performance management, analytics, and strategic financial management with practical examples that connect the syllabus to real finance roles.",
    lessons: [
      { _id: "cma-1", sectionName: "Part 1 - Financial Planning", title: "Planning, Budgeting and Forecasting", duration: "55 min", isFreePreview: true, order: 1 },
      { _id: "cma-2", sectionName: "Part 1 - Financial Planning", title: "Performance Management and Cost Analysis", duration: "60 min", isFreePreview: false, order: 2 },
      { _id: "cma-3", sectionName: "Part 1 - Analytics", title: "Internal Controls and Technology", duration: "50 min", isFreePreview: false, order: 3 },
      { _id: "cma-4", sectionName: "Part 2 - Strategic Finance", title: "Financial Statement Analysis", duration: "60 min", isFreePreview: true, order: 4 },
      { _id: "cma-5", sectionName: "Part 2 - Decision Support", title: "Corporate Finance and Risk Management", duration: "65 min", isFreePreview: false, order: 5 },
    ],
  },
  cfa: {
    title: "CFA",
    instructor: "Harsh Trivedi",
    duration: "Level-based preparation",
    level: "Professional",
    shortDescription:
      "A premier investment credential built for candidates pursuing equity research, portfolio management, valuation, and capital markets roles.",
    description:
      "Our CFA preparation focuses on helping candidates build strong conceptual depth while staying tightly aligned with exam expectations. The program covers investment tools, asset classes, ethics, valuation, and portfolio management with a teaching style that simplifies difficult topics and ties them back to real-world finance applications.",
    lessons: [
      { _id: "cfa-1", sectionName: "Level I Foundations", title: "Ethical and Professional Standards", duration: "50 min", isFreePreview: true, order: 1 },
      { _id: "cfa-2", sectionName: "Level I Foundations", title: "Quantitative Methods for Finance", duration: "60 min", isFreePreview: false, order: 2 },
      { _id: "cfa-3", sectionName: "Valuation and Analysis", title: "Equity Valuation Frameworks", duration: "65 min", isFreePreview: true, order: 3 },
      { _id: "cfa-4", sectionName: "Valuation and Analysis", title: "Fixed Income and Credit Analysis", duration: "60 min", isFreePreview: false, order: 4 },
      { _id: "cfa-5", sectionName: "Portfolio Management", title: "Portfolio Construction and Risk", duration: "55 min", isFreePreview: false, order: 5 },
    ],
  },
};

export const instructorProfile = {
  name: "Harsh Trivedi",
  role: "Finance Professional and Lead Instructor",
  credentials: ["CFA Level 2", "PGDM", "MBA", "B.Com"],
  bio:
    "With over 10 years of hands-on experience in the financial services industry, Harsh brings real-world depth to every classroom session. His professional journey spans equity valuation, real estate valuation, credit analysis, and financial analysis - giving students insight that goes far beyond textbooks. He has personally cleared CFA Level 2 and brings that exam experience directly into his teaching methodology, helping students navigate the most challenging concepts with clarity and precision.",
  expertise: [
    "Equity Valuation",
    "Real Estate Valuation",
    "Credit Analysis",
    "Financial Analysis",
    "Portfolio Management",
    "Financial Modeling",
  ],
};

export const testimonials: (Testimonial & { courseName: string })[] = [
  {
    _id: "testimonial-1",
    studentId: "",
    studentName: "Rishabh Dayama",
    rating: 5,
    review:
      "Truly great faculty. Harsh Sir has in-depth subject knowledge and a highly engaging teaching style. He is focused on practical application and highly committed to students' progress. Excited for Capital Labs!",
    featured: true,
    status: "approved",
    courseId: "course-cfa",
    courseName: "Capital Lab Education Student",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "testimonial-2",
    studentId: "",
    studentName: "Manya Patel",
    rating: 5,
    review:
      "Harsh Sir, you are truly one of the best teachers. Your guidance is exceptional, and your knowledge is truly inspiring. Your teaching style is so clear that we understand everything in just one explanation. We feel really fortunate and grateful to have you as our mentor.",
    featured: true,
    status: "approved",
    courseId: "course-cma-us",
    courseName: "Capital Lab Education Student",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "testimonial-3",
    studentId: "",
    studentName: "Vishal Sharma",
    rating: 5,
    review:
      "I'm really grateful to have you as my CFA mentor. Your ability to simplify complex concepts made a huge difference. It never felt like formal teaching - it felt like guidance from an elder brother who wants you to succeed. Highly recommended for anyone serious about CFA.",
    featured: true,
    status: "approved",
    courseId: "course-cfa",
    courseName: "CFA Candidate - Capital Lab Education",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "testimonial-4",
    studentId: "",
    studentName: "Chhaya Shukla",
    rating: 5,
    review:
      "Understanding finance took a downturn for me, but having learnt the concepts from basics by Harsh Sir brought huge confidence.",
    featured: true,
    status: "approved",
    courseId: "course-cfa",
    courseName: "CFA Level 1 Student - Capital Lab Education",
    createdAt: new Date().toISOString(),
  },
];

export const testimonialFilters = [
  "All",
  "Capital Lab Education Student",
  "CFA Candidate - Capital Lab Education",
];
