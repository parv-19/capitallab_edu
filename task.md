**CAPITAL LAB EDUCATION**

Website Development

Phase-wise AI Prompt Guide

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

5 Phases · 9 Pages · 2 Panels · 1 AI Chatbot

Stack: Next.js · Node/Express · MongoDB Atlas · JWT

April 2026 · Version 2.0 · Confidential

**Project Architecture & Tech Stack**

_Paste this stack overview as context to your AI assistant (Cursor / Claude / v0) at the start of every session._

**Stack at a Glance**

| **Frontend**           | Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui                        |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **Admin / Student UI** | NextAdmin dashboard template - <https://github.com/NextAdminHQ/nextjs-admin-dashboard> |
| **Backend**            | Node.js + Express.js (separate repo/service, port 5000)                                |
| **Database**           | MongoDB Atlas (cloud-hosted MongoDB)                                                   |
| **ODM**                | Mongoose - schema definitions + validation                                             |
| **Auth**               | JWT (jsonwebtoken) - access token (15 min) + refresh token (7 days) in httpOnly cookie |
| **Password hashing**   | bcryptjs                                                                               |
| **File Uploads**       | Multer → stored to local /uploads or cloud (Cloudinary / AWS S3)                       |
| **Email**              | Nodemailer (SMTP / Gmail App Password) - lead alerts + password reset                  |
| **AI Chatbot LLM**     | Anthropic Claude claude-sonnet-4-20250514 via @anthropic-ai/sdk                        |
| **Embeddings**         | OpenAI text-embedding-3-small                                                          |
| **Vector Search**      | MongoDB Atlas Vector Search (same DB - no extra service needed!)                       |
| **Doc Parsing**        | pdf-parse (PDF) + mammoth (DOCX)                                                       |
| **Text Chunking**      | LangChain RecursiveCharacterTextSplitter                                               |
| **Hosting**            | Vercel (Next.js frontend) + Railway / Render (Express backend)                         |

**Monorepo Folder Structure**

| **/frontend**               | Next.js 14 app - all pages, components, hooks                                         |
| --------------------------- | ------------------------------------------------------------------------------------- |
| **/frontend/app**           | App Router pages - / /about /courses /login /student/\* /admin/\*                     |
| **/frontend/components**    | Shared UI components (Navbar, Footer, LeadForm, CourseCard …)                         |
| **/frontend/lib**           | API client (axios instance), auth helpers, types                                      |
| **/backend**                | Express.js server                                                                     |
| **/backend/src/routes**     | auth.routes.ts · course.routes.ts · lead.routes.ts · chat.routes.ts · admin.routes.ts |
| **/backend/src/models**     | User · Course · Lesson · Lead · Testimonial · Document · ChatSession                  |
| **/backend/src/middleware** | authMiddleware (verify JWT) · adminOnly · studentOnly · multer upload                 |
| **/backend/src/lib**        | rag/ folder - parseDoc · chunkText · embedAndStore · retrieveContext                  |
| **/backend/src/utils**      | sendEmail · generateTokens · asyncHandler                                             |

**API Base URLs**

| **Development** | Frontend: <http://localhost:3000> \| Backend: <http://localhost:5000/api>             |
| --------------- | ------------------------------------------------------------------------------------- |
| **Production**  | Frontend: <https://capitallabedu.com> \| Backend: <https://api.capitallabedu.com/api> |
| **CORS**        | Backend allows origin: process.env.FRONTEND_URL with credentials: true                |

**Route Structure (Frontend)**

| **/**                 | Home page - hero, courses, lead form, testimonials |
| --------------------- | -------------------------------------------------- |
| **/about**            | About Us                                           |
| **/courses**          | Course listing (2 courses)                         |
| **/courses/\[slug\]** | Course detail page                                 |
| **/testimonials**     | Full testimonials page                             |
| **/login /signup**    | Auth pages                                         |
| **/forgot-password**  | Password reset flow                                |
| **/student/\***       | Student dashboard (JWT required, role=student)     |
| **/admin/\***         | Admin panel (JWT required, role=admin)             |

| **PHASE 1**<br><br>Week 1-2 | **Project Setup + Premium Public Website**<br><br>Next.js scaffold · Brand system · Home · About · Courses · Testimonials · Auth |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |

**Master Context - paste once per Phase 1 session**

**◈ PHASE 1 MASTER CONTEXT**

_You are building the Capital Lab Education website - an offline coaching institute in Ahmedabad, India. FRONTEND STACK: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui. BACKEND: Node.js + Express running at <http://localhost:5000/api> (built in parallel). AUTH: JWT stored in httpOnly cookie. No Firebase. No Google OAuth. Email + Password only. STARTER REPO: <https://github.com/NextAdminHQ/nextjs-admin-dashboard> - use ONLY for /admin and /student dashboard shell. Public pages get fully custom design. BRAND: Primary #1E3A8A (navy) | Accent #C8952A (gold) | Font: Poppins | Mood: premium, academic, trustworthy. BUSINESS: Offline coaching. NO payment gateway. All CTAs open a lead-capture form → POST /api/leads. TWO ROLES: student → /student/\* | admin → /admin/\* Auth middleware in Next.js reads JWT from cookie, verifies via GET /api/auth/me, redirects if invalid/wrong role. Write complete production-ready TypeScript. No placeholders. Tailwind + shadcn/ui only._

**1.1 Backend Foundation (Express + MongoDB)**

**◈ Prompt 1.1 - Express Server Scaffold**

_Scaffold the Express backend at /backend: SETUP: npm init -y npm install express mongoose dotenv cors cookie-parser bcryptjs jsonwebtoken npm install multer nodemailer @anthropic-ai/sdk openai langchain pdf-parse mammoth npm install -D typescript ts-node nodemon @types/express @types/node @types/cors @types/bcryptjs @types/jsonwebtoken @types/multer @types/nodemailer Create /backend/src/index.ts: - Express app, CORS (origin: FRONTEND_URL, credentials: true) - cookie-parser middleware - JSON body parser - Connect to MongoDB Atlas via mongoose: mongoose.connect(process.env.MONGO_URI) - Mount routes: /api/auth · /api/courses · /api/leads · /api/admin · /api/student/chat - Global error handler middleware - Listen on process.env.PORT || 5000 Create Mongoose models in /backend/src/models/: User.model.ts: { name, email, password (hashed), phone?, role: 'student'|'admin' (default 'student'), enrollments: \[ObjectId ref Course\], avatar?, createdAt, isBlocked: bool } Course.model.ts: { title, slug (unique), instructor, description, shortDescription, thumbnail, duration, level, status: 'draft'|'published', createdAt } Lesson.model.ts: { courseId (ref), sectionName, title, order, videoUrl, description, resources: \[ObjectId ref CourseDocument\], duration, isFreePreview: bool } Lead.model.ts: { name, phone, email?, courseInterest, preferredTime, message?, status: 'new'|'contacted'|'visit_scheduled'|'enrolled'|'closed' (default 'new'), notes: \[{ text, addedAt }\], createdAt } Testimonial.model.ts: { studentId (ref User), studentName, courseId (ref Course), rating (1-5), review, status: 'pending'|'approved' (default 'pending'), featured: bool, createdAt } CourseDocument.model.ts: { courseId (ref), name, filePath (local path or cloud URL), fileType, size, processedForAI: bool (default false), chunksCount: number, uploadedAt } ChatSession.model.ts: { userId (ref User), title, courseIds: \[ObjectId\], messages: \[{ role, content, timestamp }\], createdAt } Create /backend/src/utils/generateTokens.ts: - generateAccessToken(userId, role): JWT expires 15m - generateRefreshToken(userId): JWT expires 7d - Both use process.env.JWT_SECRET_

**◈ Prompt 1.2 - Auth Routes (JWT, no Firebase)**

_Build /backend/src/routes/auth.routes.ts and /backend/src/controllers/auth.controller.ts: POST /api/auth/signup: - Validate: name, email, password (min 8 chars), confirmPassword match - Check email not already registered - Hash password: bcrypt.hash(password, 12) - Create User in MongoDB with role: 'student' - Generate accessToken + refreshToken - Set refreshToken as httpOnly cookie (maxAge: 7 days, sameSite: 'lax', secure in prod) - Return: { user: { \_id, name, email, role }, accessToken } POST /api/auth/login: - Find user by email, compare bcrypt - If user.isBlocked → 403 "Your account has been blocked" - Generate tokens, set cookie - Return: { user, accessToken } POST /api/auth/logout: - Clear refreshToken cookie - Return: { message: 'Logged out' } POST /api/auth/refresh: - Read refreshToken from cookie - Verify JWT, find user - Issue new accessToken - Return: { accessToken } GET /api/auth/me: - Requires authMiddleware (Bearer token in Authorization header) - Return: { user: { \_id, name, email, role, enrollments, avatar } } POST /api/auth/forgot-password: - Find user by email, generate resetToken (crypto.randomBytes(32).toString('hex')) - Save hashed token + expiry (30 min) to user doc - Send email via Nodemailer with reset link: FRONTEND_URL/reset-password?token=TOKEN POST /api/auth/reset-password: - Validate token from query, check not expired - Hash new password, save, clear reset fields - Return: { message: 'Password updated' } Create /backend/src/middleware/auth.middleware.ts: - authMiddleware: reads Bearer token, verifies JWT, attaches req.user - adminOnly: checks req.user.role === 'admin', else 403 - studentOnly: checks req.user.role === 'student', else 403_

**1.3 Next.js Frontend Scaffold**

**◈ Prompt 1.3 - Next.js Init + Auth Context**

_Scaffold the Next.js 14 frontend at /frontend: npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir=false cd frontend npx shadcn-ui@latest init (use default theme) npm install axios js-cookie @types/js-cookie lucide-react clsx framer-motion Create /frontend/lib/axios.ts: - axios instance with baseURL: process.env.NEXT_PUBLIC_API_URL - withCredentials: true (sends cookies) - Request interceptor: attach accessToken from localStorage to Authorization header - Response interceptor: on 401, call POST /api/auth/refresh to get new accessToken, retry original request once; on second 401 redirect to /login Create /frontend/lib/auth.ts: - Functions: login(email,pass) · signup(data) · logout() · getMe() · forgotPassword(email) · resetPassword(token,pass) Create /frontend/contexts/AuthContext.tsx: - useReducer for { user, isLoading, isAuthenticated } - On mount: call getMe() to rehydrate auth state from cookie - Provide: user, isLoading, isAuthenticated, login(), logout(), signup() Create /frontend/middleware.ts (Next.js middleware): - Protect /student/\* → redirect to /login if no valid session cookie - Protect /admin/\* → redirect to /login if no valid session cookie - (Role validation happens client-side after getMe() returns role) Create /frontend/types/index.ts: - Interfaces: User, Course, Lesson, Lead, Testimonial, CourseDocument, ChatMessage, ChatSession, Enrollment_

**1.4 Global Layout + Lead Form**

**◈ Prompt 1.4 - Navbar, Footer, LeadForm**

_Create global layout components: 1. /frontend/components/layout/Navbar.tsx: - Sticky. On scroll > 50px: bg-\[#1E3A8A\] shadow-lg, else transparent (only on home hero, bg-\[#1E3A8A\] on other pages) - Left: Capital Lab Education logo (text logo with gold accent dot) - Center nav links: Home / Courses / About / Testimonials - Right: Login button (outlined, white border) - Logged-in state: replace Login with avatar circle + dropdown (My Dashboard / Logout) - Mobile: hamburger → full-screen slide-down menu - Use AuthContext to check isAuthenticated + user.role → link "My Dashboard" to /student or /admin accordingly 2. /frontend/components/layout/Footer.tsx: - 4-column grid: (1) Logo + tagline + social icons (2) Quick Links (3) Courses (4) Contact - Bottom bar: copyright © 2026 Capital Lab Education - Social icons: Instagram, YouTube, LinkedIn, WhatsApp (lucide-react or inline SVG) 3. /frontend/components/ui/LeadForm.tsx: - Reusable component: accepts prop mode: 'modal' | 'inline' - Fields: Full Name\* | Phone\* | Course Interest (select: Course 1/Course 2/Both) | Preferred Visit Time (select: Morning 9-12 / Afternoon 12-5 / Evening 5-8) | Message (textarea, optional) - On submit: POST /api/leads via axios, show success toast (shadcn/ui Sonner) - In modal mode: wrapped in shadcn Dialog - Validation: required fields, phone must be 10 digits 4. /frontend/app/layout.tsx: - Wraps with AuthProvider, Navbar (only on public pages), Footer (only on public pages) - /student/\* and /admin/\* get their own layout (NextAdmin shell - no public Navbar/Footer)_

**1.5 Public Pages**

**◈ Prompt 1.5 - Home Page (Premium)**

_Build /frontend/app/page.tsx - the Home page: HERO SECTION: - Full-viewport. Background: linear-gradient(135deg, #0F2461, #1E3A8A, #2563EB) - Subtle SVG geometric mesh pattern overlay (opacity 0.08) - LEFT: Tag badge ("Ahmedabad's Premier Coaching") → H1 with "Unlock Your" (white) + "Potential" (gold) → subheadline (14px, muted blue-white) → two CTAs: "Explore Courses" (gold solid) scrolls to #courses section + "Book a Free Visit" (outlined white) opens LeadForm modal - RIGHT: Floating glassmorphism stats card (backdrop-blur, white/10 bg, 1px white/20 border). Stats: 500+ Students / 98% Success Rate / 5★ Rating / 10+ Years - Framer Motion: staggered fade-up (0.1s between each element) VALUE PROPOSITION (3 cards): - "Expert Faculty" / "Proven Results" / "Personal Attention" - Each: gold icon (lucide), navy heading, gray body text, white card with subtle shadow FEATURED COURSES (id="courses"): - Side-by-side cards. Each: banner image (Next/Image), gold tag, title, instructor, duration, 3-line description, "Know More →" + "Enquire Now" button - Course data from GET /api/courses?status=published HOW IT WORKS: 3-step horizontal flow with gold numbered circles + connecting dashed line 1 Browse & Enquire → 2 Visit Our Centre → 3 Start Learning TESTIMONIALS TEASER: 3 cards (hardcoded or from GET /api/testimonials?featured=true&limit=3) Each: avatar initial circle, name, course badge, ★★★★★, 2-line italic quote CTA STRIP: Full-width navy. "Start your success story today" + gold "Book Free Consultation" button All sections: scroll-triggered fade-in (Framer Motion useInView, threshold: 0.15, triggerOnce)._

**◈ Prompt 1.6 - About, Courses, Testimonials, Auth Pages**

_Build these pages: ABOUT (/app/about/page.tsx): - Hero: mission headline + 2-para description + stat counters (react-countup on scroll) - Timeline: 4 milestones (alternating left/right layout) - Team grid: 2-3 instructor cards (photo, name, credentials, bio, subject tags) - Values: 4 icon cards (Quality / Affordability / Personal Attention / Community) - CTA: "Book Free Visit" button COURSES (/app/courses/page.tsx + /app/courses/\[slug\]/page.tsx): - Listing: horizontal card per course, "Enquire Now" CTA (no price shown) - Detail: tabbed layout (Overview / Curriculum accordion / Instructor / Reviews) - Sticky sidebar: "Book Free Counselling" → LeadForm - Mobile: fixed bottom "Enquire Now" bar - Data: GET /api/courses and GET /api/courses/:slug TESTIMONIALS (/app/testimonials/page.tsx): - Filter tabs (All / Course 1 / Course 2), masonry grid of cards - Data: GET /api/testimonials?status=approved&courseId=... LOGIN (/app/login/page.tsx): - Split card: left brand panel (navy, logo, quote), right form - Email + password, "Forgot Password?" link, Login button - Calls AuthContext.login(), redirects based on role (admin→/admin, student→/student) - Error toast on wrong credentials SIGNUP (/app/signup/page.tsx): - Full Name, Email, Password (strength meter), Confirm Password, Phone (optional), Terms checkbox - Calls AuthContext.signup(), redirects to /student FORGOT PASSWORD (/app/forgot-password/page.tsx): - Step 1: email input → POST /api/auth/forgot-password - Step 2: "Check your inbox" screen + Resend button - /app/reset-password/page.tsx: reads ?token= from URL → new password form → POST /api/auth/reset-password → redirect /login + success toast_

| **PHASE 2**<br><br>Week 3-4 | **Admin Dashboard**<br><br>NextAdmin shell · Course + Lesson CRUD · Lead CRM · Doc uploads · Student mgmt |
| --------------------------- | --------------------------------------------------------------------------------------------------------- |

**Master Context - Phase 2 Admin Panel**

**◈ PHASE 2 MASTER CONTEXT**

_You are building the Admin Dashboard at /admin/\* for Capital Lab Education. SHELL: Use NextAdmin template (<https://github.com/NextAdminHQ/nextjs-admin-dashboard>) as sidebar layout. Recolour to navy #1E3A8A / gold #C8952A. AUTH: JWT from cookie. Middleware already redirects non-admin. All API calls go to <http://localhost:5000/api> with Authorization: Bearer &lt;accessToken&gt;. BACKEND: Node.js + Express + MongoDB Atlas. All routes already created or being created in parallel. ADMIN CAN: - View live stats (leads, students, courses) - Full CRUD on courses and lessons - Upload documents per course (sent to Express /api/admin/documents/upload) - Trigger AI processing per document - Manage leads (view, status, notes, export CSV) - Manage students (view, block/unblock, manual enroll) - Approve / reject student testimonials Write complete TypeScript. Tailwind + shadcn/ui only._

**2.1 Admin Backend Routes**

**◈ Prompt 2.1 - Admin Express Routes**

_Build admin backend routes (all protected by authMiddleware + adminOnly): /backend/src/routes/admin.routes.ts - mount at /api/admin: DASHBOARD: GET /api/admin/stats → returns: { totalLeads, newLeadsThisMonth, totalStudents, activeCoures, pendingTestimonials, weeklyLeads: \[{ week, count }\] } → Uses MongoDB aggregation pipelines for counts COURSES: GET /api/admin/courses → all courses (any status) POST /api/admin/courses → create course { title, slug, instructor, description, shortDescription, thumbnail(upload), duration, level, status } PUT /api/admin/courses/:id → update course DELETE /api/admin/courses/:id → delete course + its lessons + documents LESSONS: GET /api/admin/courses/:courseId/lessons → all lessons sorted by order POST /api/admin/courses/:courseId/lessons → create lesson PUT /api/admin/courses/:courseId/lessons/:id → update lesson DELETE /api/admin/courses/:courseId/lessons/:id → delete lesson PATCH /api/admin/courses/:courseId/lessons/reorder → body: { orderedIds: \[id, id, ...\] } → bulk update order field DOCUMENTS: GET /api/admin/courses/:courseId/documents → list documents POST /api/admin/courses/:courseId/documents/upload → multer single file (PDF/DOCX/TXT, max 20MB) → save to /backend/uploads/{courseId}/ → create CourseDocument in MongoDB DELETE /api/admin/courses/:courseId/documents/:id → delete file + MongoDB doc POST /api/admin/documents/:id/process → triggers RAG pipeline (Phase 4), returns { chunksStored } THUMBNAILS: multer middleware saves course thumbnail to /backend/uploads/thumbnails/, return relative URL._

**◈ Prompt 2.2 - Leads + Students + Testimonials Backend Routes**

_Continue /backend/src/routes/admin.routes.ts: LEADS: GET /api/admin/leads → paginated (page, limit), filter by status/courseInterest/dateRange, search by name/phone returns: { leads: \[...\], total, pages } PATCH /api/admin/leads/:id/status → body: { status } POST /api/admin/leads/:id/notes → body: { text } → push to lead.notes array DELETE /api/admin/leads/:id GET /api/admin/leads/export → returns CSV string of filtered leads (use fast-csv or manual CSV string) STUDENTS: GET /api/admin/students → paginated list of users with role=student, populate enrollments GET /api/admin/students/:id → full student profile + progress + lead origin PATCH /api/admin/students/:id/block → set isBlocked: true PATCH /api/admin/students/:id/unblock → set isBlocked: false POST /api/admin/students/:id/enroll → body: { courseId } → push courseId to user.enrollments if not already there TESTIMONIALS: GET /api/admin/testimonials → all, filter by status PATCH /api/admin/testimonials/:id/approve → set status: 'approved' PATCH /api/admin/testimonials/:id/reject → set status: 'rejected' PATCH /api/admin/testimonials/:id/featured → toggle featured boolean DELETE /api/admin/testimonials/:id LEADS - also add public route (no auth): POST /api/leads → create new lead (called from frontend lead form) → Also sends email notification via Nodemailer to admin email_

**2.3 Admin Frontend - Dashboard + Leads**

**◈ Prompt 2.3 - Admin Shell + Overview + Leads CRM**

_Build admin frontend: 1. ADMIN LAYOUT (/frontend/app/admin/layout.tsx): - Import NextAdmin sidebar shell - Recolor sidebar: background #1E3A8A, active item gold #C8952A - Sidebar nav items with lucide icons: Dashboard / Leads / Courses / Students / Testimonials / Settings - Top bar: breadcrumb left, admin name + avatar right - All pages under /admin/\* use this layout 2. OVERVIEW (/frontend/app/admin/page.tsx): - 4 stat cards (from GET /api/admin/stats): Total Leads This Month / Total Students / Active Courses / Pending Reviews - Recharts BarChart: weekly leads for last 4 weeks (data from stats.weeklyLeads) - Recent Leads table (last 10): Name / Phone / Course Interest / Date / Status badge - Quick Actions row: "Add Course" button / "View All Leads" button 3. LEADS CRM (/frontend/app/admin/leads/page.tsx): - Data table with TanStack Table (already in NextAdmin) - Columns: # / Name / Phone / Course / Preferred Time / Date / Status (color badge) / Actions - Status badge colors: new=blue / contacted=yellow / visit_scheduled=purple / enrolled=green / closed=gray - Actions dropdown (shadcn DropdownMenu): Mark Contacted / Schedule Visit / Mark Enrolled / Add Note / Delete - Filters row: search input + status select + date range picker (shadcn DatePickerWithRange) - "Export CSV" button → GET /api/admin/leads/export, triggers file download - Click row → right slide-over Drawer: full lead details + notes list + "Add Note" textarea + Save button_

**◈ Prompt 2.4 - Course CRUD + Lesson Manager + Document Upload UI**

_Build admin course management pages: COURSE LIST (/frontend/app/admin/courses/page.tsx): - Table: Title / Instructor / Lessons / Status badge / Actions (Edit / Manage Lessons / Upload Docs / Delete) - "Add Course" button → shadcn Dialog with form: Title, Slug (auto-generate from title, editable), Instructor Name, Duration, Level (select), Short Description, Full Description (textarea), Thumbnail (file input → POST to /api/admin/courses with multipart), Status toggle (Draft/Published) - Edit course → same Dialog pre-filled - Delete → confirm AlertDialog LESSON MANAGER (/frontend/app/admin/courses/\[courseId\]/lessons/page.tsx): - @dnd-kit/core drag-and-drop sortable list - Each lesson row: drag handle / section tag / title / duration / free-preview badge / edit/delete actions - "Add Lesson" Dialog: Title, Section Name, Video URL (YouTube/Vimeo), Description, Duration (text), Free Preview toggle, Resources (multi-select from already-uploaded docs) - On drag end: PATCH /api/admin/courses/:id/lessons/reorder with new order DOCUMENT UPLOAD (/frontend/app/admin/courses/\[courseId\]/documents/page.tsx): - react-dropzone upload zone: PDF/DOCX/TXT only, max 20MB - On drop: POST /api/admin/courses/:id/documents/upload (FormData, multipart) - Document list table: filename / type / size / uploadedAt / AI Status badge (Pending/Processing/Ready/Error) / Actions - "Process for AI" button per doc → POST /api/admin/documents/:id/process → poll status every 3s until Ready/Error - Delete doc button STUDENT MANAGEMENT (/frontend/app/admin/students/page.tsx): - Table: Name / Email / Courses Enrolled / Join Date / Status (Active/Blocked) / Actions - Actions: View (drawer with profile+progress) / Block / Unblock / Manual Enroll (select course modal) TESTIMONIALS (/frontend/app/admin/testimonials/page.tsx): - Tabs: Pending / Approved - Each card: student name, course, stars, review text, date, Approve/Reject buttons - Approved tab: toggle Featured switch per testimonial_

| **PHASE 3**<br><br>Week 5 | **Student Dashboard**<br><br>NextAdmin shell · My Courses · Course Player · AI Study Chatbot · Profile |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |

**Master Context - Phase 3 Student Panel**

**◈ PHASE 3 MASTER CONTEXT**

_You are building the Student Dashboard at /student/\* for Capital Lab Education. SHELL: Same NextAdmin template but student-themed (lighter navy sidebar, purple/indigo accent). AUTH: JWT cookie. req.user is the logged-in student. All API calls scoped to their userId. BACKEND: Express routes at /api/student/\* (protected by authMiddleware + studentOnly). STUDENT CAN: 1. View enrolled courses + progress 2. Watch lesson videos + mark complete 3. Chat with AI study assistant (answers from course documents) 4. Edit their own profile Data scoping: students ONLY see courses they are enrolled in. Never expose other students' data. Write complete TypeScript. Tailwind + shadcn/ui only._

**3.1 Student Backend Routes**

**◈ Prompt 3.1 - Student Express Routes**

_Build /backend/src/routes/student.routes.ts (all protected authMiddleware + studentOnly): GET /api/student/dashboard → returns: { user: { name, avatar, enrollments }, enrolledCourses: \[{ course details + progress % }\], stats: { lessonsCompleted, coursesEnrolled, recentActivity: \[last 5 { lessonTitle, courseTitle, timestamp }\] } } → progress stored in user's embedded progress map OR separate Progress model: Progress: { userId, courseId, completedLessons: \[lessonId\], lastAccessed } GET /api/student/courses/:courseId → only if userId in course enrollments → returns full course with lessons (sorted by order), user progress for this course POST /api/student/courses/:courseId/lessons/:lessonId/complete → mark lesson complete: upsert Progress doc, add lessonId to completedLessons → recalculate percentComplete POST /api/student/lessons/:lessonId/questions → body: { question } → save to LessonQuestion: { lessonId, userId, question, answer?, askedAt } GET /api/student/lessons/:lessonId/questions → return questions for lesson (only this student's, unless admin) POST /api/student/testimonials → only if enrolled in courseId → create Testimonial with status 'pending' PUT /api/student/profile → update name, phone, avatar (multer upload) PUT /api/student/profile/password → reauthenticate (verify current password), update hashed password GET /api/student/chat/sessions → paginated list of user's ChatSessions POST /api/student/chat/sessions → create new ChatSession { userId, courseIds, title: 'New Chat', messages: \[\] } (Streaming chat POST /api/student/chat/:sessionId/message is built in Phase 4)_

**3.2 Student Frontend**

**◈ Prompt 3.2 - Student Dashboard Home + Course Player**

_Build student frontend pages: 1. STUDENT LAYOUT (/frontend/app/student/layout.tsx): - NextAdmin sidebar, student colour scheme (indigo-600 accent instead of gold for student side) - Sidebar: Dashboard / My Courses / AI Study Chat / Profile / Logout - Top bar: "Welcome, \[name\]" + avatar 2. DASHBOARD HOME (/frontend/app/student/page.tsx): - Welcome banner: "Welcome back, \[First Name\]!" + date + rotating motivational quote (array of 10) - My Courses section: card per enrolled course (thumbnail, title, instructor, progress bar %, "Continue Learning" button) - Empty state if no enrollments: illustration + "Browse our courses →" link to /courses - Stats row: Lessons Completed / Courses Enrolled / Day Streak - Recent Activity: last 5 lesson accesses with timestamps - All data from GET /api/student/dashboard 3. COURSE PLAYER (/frontend/app/student/courses/\[courseId\]/page.tsx): LEFT SIDEBAR (280px): - Course title + circular progress indicator - Accordion by sectionName → lesson list - Lesson item: checkmark (completed=gold filled, current=navy ring, upcoming=gray) + title + duration - Click → loads lesson in right panel (no page reload, just state update) RIGHT PANEL: - YouTube/Vimeo responsive iframe (16:9, full width) - Below video: lesson title, description - RESOURCES: list of attached docs with download links (from Express /uploads/ static serving) - Prev / Next lesson buttons - "Mark as Complete" checkbox → POST /api/student/courses/:id/lessons/:lid/complete → progress bar updates - Q&A section: textarea "Ask a question" + submit → POST /api/student/lessons/:id/questions → show question in list with "Awaiting answer" badge MOBILE: sidebar in bottom sheet (shadcn Sheet component)_

**◈ Prompt 3.3 - AI Study Chatbot UI + Student Profile**

_1\. AI STUDY CHAT (/frontend/app/student/chat/page.tsx): LAYOUT: Full height, two-panel (like ChatGPT): LEFT (260px): - "New Chat" button (creates new session via POST /api/student/chat/sessions) - List of past sessions from GET /api/student/chat/sessions (title = first message truncated, date) - Click session → load its messages RIGHT (chat area): - Messages: user messages right-aligned (navy bubble) / AI messages left-aligned (white card, Capital Lab avatar) - Typing indicator (3 animated bouncing dots) during streaming - COURSE CONTEXT selector (top): dropdown "Asking about: \[Course Name\]" - only shows enrolled courses - Empty state: 4 starter prompt chips: "Summarise Chapter 1" / "Explain \[topic\] simply" / "Give me 5 practice questions" / "Key formulas to remember" - Input bar: auto-resize textarea + Send button (or Enter key) - Streaming: connect to POST /api/student/chat/:sessionId/message (built Phase 4), read ReadableStream - Disclaimer below input: "Answers are based on your course materials. For complex doubts, ask your instructor." 2. STUDENT PROFILE (/frontend/app/student/profile/page.tsx): - Avatar upload (click circle → file input → POST /api/student/profile with FormData) - Editable: Full Name, Phone | Read-only: Email - Change Password card: Current Password, New Password (strength meter), Confirm New Password - Enrolled Courses list (view-only, with enrollment dates) - Logout button with confirm dialog - All using shadcn Card, Input, Button, Switch, Separator_

| **PHASE 4**<br><br>Week 6 | **AI Chatbot Backend - RAG Pipeline**<br><br>Doc parsing · MongoDB Atlas Vector Search · Claude streaming · Chat endpoint |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------- |

**Master Context - Phase 4 AI Backend**

**◈ PHASE 4 MASTER CONTEXT**

_You are building the RAG (Retrieval-Augmented Generation) chatbot for Capital Lab Education. EVERYTHING RUNS ON MONGODB ATLAS - no Pinecone needed. Atlas Vector Search lets us store embeddings IN the same MongoDB database. PIPELINE: 1. Admin uploads PDF/DOCX → saved to /backend/uploads/ 2. Admin clicks "Process for AI" → POST /api/admin/documents/:id/process 3. Express downloads file from disk, parses text, chunks it, generates embeddings, stores in MongoDB 4. Student sends chat message → GET relevant chunks via MongoDB Atlas Vector Search 5. Chunks + question → Claude API → stream response back TECH: - LLM: Anthropic claude-sonnet-4-20250514 via @anthropic-ai/sdk (streaming) - Embeddings: OpenAI text-embedding-3-small (1536 dimensions) - Vector DB: MongoDB Atlas Vector Search index on DocumentChunk collection - Text parsing: pdf-parse + mammoth - Chunking: LangChain RecursiveCharacterTextSplitter (chunkSize: 800, overlap: 100) ENV VARS: ANTHROPIC_API_KEY, OPENAI_API_KEY, MONGO_URI (already set) Write complete production TypeScript with full error handling._

**4.1 MongoDB Atlas Vector Search Setup**

**◈ Prompt 4.1 - DocumentChunk Model + Atlas Vector Index**

_1\. Create Mongoose model /backend/src/models/DocumentChunk.model.ts: { documentId: ObjectId (ref CourseDocument), courseId: ObjectId (ref Course), filename: String, chunkIndex: Number, text: String, // the raw chunk text (for returning in context) embedding: \[Number\] // 1536-dimensional vector from OpenAI } Add index: { courseId: 1 } for filtered queries. 2. Create Atlas Vector Search index instruction (add to README and setup guide): In MongoDB Atlas UI → your cluster → Search → Create Search Index → JSON editor: { "fields": \[{ "type": "vector", "path": "embedding", "numDimensions": 1536, "similarity": "cosine" }, { "type": "filter", "path": "courseId" }\] } Index name: "document_chunks_vector_index" Collection: &lt;dbname&gt;.documentchunks 3. Create /backend/src/lib/rag/parseDocument.ts: - Accepts: filePath (absolute), fileType ('pdf'|'docx'|'txt') - PDF: const data = await pdfParse(fs.readFileSync(filePath)); return data.text - DOCX: const result = await mammoth.extractRawText({ path: filePath }); return result.value - TXT: return fs.readFileSync(filePath, 'utf-8') - Returns: { text: string } 4. Create /backend/src/lib/rag/chunkText.ts: - Import RecursiveCharacterTextSplitter from langchain/text_splitter - Split with chunkSize: 800, chunkOverlap: 100 - Returns: string\[\] 5. Create /backend/src/lib/rag/embedAndStore.ts: - Accepts: { chunks: string\[\], documentId, courseId, filename } - Use OpenAI client: const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) - Batch embed in groups of 100: openai.embeddings.create({ model: 'text-embedding-3-small', input: batch }) - For each chunk: create DocumentChunk in MongoDB with embedding array - Returns: { chunksStored: number }_

**4.2 Process Document Route + RAG Chat Endpoint**

**◈ Prompt 4.2 - Process API + Streaming Chat**

_1\. Build POST /api/admin/documents/:id/process (in admin.routes.ts): - authMiddleware + adminOnly - Find CourseDocument by id → get filePath, fileType, courseId, filename - Set document.processedForAI = false, save (status = 'Processing') - Run pipeline: parseDocument(filePath, fileType) → chunkText(text) → embedAndStore({ chunks, documentId, courseId, filename }) - On success: update CourseDocument { processedForAI: true, chunksCount: N, processedAt: now } - On error: update CourseDocument { processingError: err.message } - Return: { success: true, chunksStored: N } - Wrap in try/catch, asyncHandler 2. Create /backend/src/lib/rag/retrieveContext.ts: - Accepts: { query: string, courseIds: ObjectId\[\], topK?: number = 5 } - Generate query embedding: openai.embeddings.create(...) - MongoDB aggregation with \$vectorSearch: pipeline = \[{ \$vectorSearch: { index: "document_chunks_vector_index", path: "embedding", queryVector: queryEmbedding, numCandidates: 100, limit: topK, filter: { courseId: { \$in: courseIds } } } }, { \$project: { text: 1, filename: 1, score: { \$meta: "vectorSearchScore" }, \_id: 0 } }\] - Run: DocumentChunk.aggregate(pipeline) - Returns: formatted context string: chunks joined with " --- " 3. Build POST /api/student/chat/:sessionId/message (STREAMING): - authMiddleware + studentOnly - Body: { message: string, courseIds: string\[\] } - Verify: all courseIds in req.user.enrollments - Find or create ChatSession - Save user message to session - Call retrieveContext({ query: message, courseIds }) - Build messages for Claude: system: "You are a helpful study assistant for Capital Lab Education, an offline coaching institute in Ahmedabad. Answer ONLY from the course materials below. If not found, say: 'This topic isn't in your current course materials - please ask your instructor.'\\n\\nCOURSE MATERIALS:\\n{context}" user: message - Stream from Claude: const stream = await anthropic.messages.stream({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, system, messages: \[{role:'user', content: message}\] }) - Set headers: Content-Type: text/event-stream, Transfer-Encoding: chunked - Pipe stream to response: for await (const chunk of stream) { res.write(chunk.delta?.text || '') } - After stream: save full assistant response to ChatSession.messages - res.end()_

| **PHASE 5**<br><br>Week 7 | **Polish, SEO & Deployment**<br><br>Animations · SEO · Env setup · Vercel + Railway deploy · Smoke tests |
| ------------------------- | -------------------------------------------------------------------------------------------------------- |

**◈ Prompt 5.1 - Framer Motion Animations**

_Add Framer Motion animations to the public website: npm install framer-motion react-countup HOME PAGE: - Hero: stagger container (staggerChildren: 0.1) → each child: initial {opacity:0, y:30} animate {opacity:1, y:0} - All other sections: useInView hook (triggerOnce, threshold:0.15) → same fade-up on enter - Value cards: stagger 0.08s between cards - Stats in hero card: react-countup (start 0, duration 1.5s, scroll trigger) - Course card hover: whileHover={{ scale: 1.02 }} + CSS box-shadow transition NAVBAR: - Background: useScroll → scrollY > 50 → bg-\[#1E3A8A\] with opacity spring - Mobile menu: AnimatePresence → height 0→auto with overflow hidden LEAD FORM MODAL: - Dialog overlay: initial {opacity:0} animate {opacity:1} - Dialog content: initial {scale:0.95, opacity:0} animate {scale:1, opacity:1} PAGE TRANSITIONS: - In /frontend/app/template.tsx (not layout.tsx) wrap with: &lt;motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{duration:0.25}}&gt; {children} &lt;/motion.div&gt; Respect: @media (prefers-reduced-motion: reduce) → disable all animations (use useReducedMotion() hook)_

**◈ Prompt 5.2 - SEO Metadata + Performance**

_SEO and performance optimisation: 1. METADATA (Next.js Metadata API): /app/layout.tsx: metadataBase, title template "Capital Lab Education | %s", defaultDescription, openGraph defaults, robots /app/page.tsx: title "Best Coaching Classes in Ahmedabad", description, keywords /app/courses/\[slug\]/page.tsx: generateMetadata() → fetch course from API → dynamic title/description/og:image Add JSON-LD LocalBusiness schema to home page (script tag with type="application/ld+json"): { @type: LocalBusiness, name, address (Ahmedabad), telephone, url, sameAs: \[social links\] } 2. IMAGE OPTIMISATION: - All &lt;img&gt; → Next.js &lt;Image&gt; with width, height, priority (above fold), placeholder="blur" - Course thumbnails: sizes="(max-width:768px) 100vw, 50vw" 3. PERFORMANCE: - Dynamic import for Framer Motion components: dynamic(()=>import(...), {ssr:false}) - Add /app/loading.tsx skeleton screens: courses page, student dashboard, admin pages - Add /app/error.tsx friendly error page 4. SITEMAP + ROBOTS: /app/sitemap.ts → fetch course slugs from /api/courses → static routes + course detail pages /app/robots.ts → disallow: /admin, /student, /api 5. VERCEL ANALYTICS: npm install @vercel/analytics @vercel/speed-insights Add &lt;Analytics /&gt; and &lt;SpeedInsights /&gt; to root layout_

**◈ Prompt 5.3 - Deployment Environment Setup**

_Create deployment configuration: 1. VERCEL (Frontend): vercel.json: { "rewrites": \[{ "source": "/api/:path\*", "destination": "<https://api.capitallabedu.com/api/:path\>\*" }\], "headers": \[{ "source": "/(.\*)", "headers": \[ { "key": "X-Frame-Options", "value": "DENY" }, { "key": "X-Content-Type-Options", "value": "nosniff" }, { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" } \] }\] } Environment variables to set in Vercel dashboard: NEXT_PUBLIC_API_URL = <https://api.capitallabedu.com> NEXT_PUBLIC_SITE_URL = <https://capitallabedu.com> 2. RAILWAY (Backend): - Create railway.json: { "build": { "builder": "NIXPACKS" }, "deploy": { "startCommand": "npm run start" } } - package.json scripts: "build": "tsc", "start": "node dist/index.js", "dev": "nodemon src/index.ts" Environment variables for Railway: NODE_ENV = production PORT = 5000 MONGO_URI = mongodb+srv://&lt;user&gt;:&lt;pass&gt;@cluster.mongodb.net/capitallab JWT_SECRET = &lt;32-char random string&gt; JWT_REFRESH_SECRET = &lt;another 32-char string&gt; FRONTEND_URL = <https://capitallabedu.com> ANTHROPIC_API_KEY = sk-ant-... OPENAI_API_KEY = sk-... NODEMAILER_USER = <your@gmail.com> NODEMAILER_PASS = &lt;gmail app password&gt; ADMIN_EMAIL = <admin@capitallabedu.com> UPLOAD_DIR = /app/uploads (Railway persistent volume) 3. MONGODB ATLAS: - Whitelist Railway IP (or use 0.0.0.0/0 for simplicity) - Create Atlas Vector Search index as described in Phase 4 - Create DB user with readWrite on capitallab database 4. CORS final check: backend allows ONLY FRONTEND_URL in production 5. Generate README.md with full local setup, env var descriptions, deploy steps_

**◈ Prompt 5.4 - Smoke Test Checklist**

_Generate a manual smoke-test checklist covering all critical paths: PUBLIC WEBSITE: □ Home page loads, hero animation plays, stats count up □ "Book a Free Visit" opens LeadForm modal, submit shows success toast, check MongoDB leads collection □ Courses page lists 2 courses from MongoDB □ Course detail page shows curriculum accordion, enquire button opens LeadForm □ About page timeline and team cards render □ Testimonials page filter tabs work AUTH: □ Signup → new user in MongoDB with role=student, redirect to /student □ Login with wrong password → error toast □ Login as student → redirect to /student/dashboard □ Login as admin → redirect to /admin □ Forgot password email arrives, reset link works, redirect to /login + toast □ JWT refresh: access token expires → auto-refresh → user stays logged in □ Blocked user login → sees "account blocked" error ADMIN: □ Stats cards show correct counts □ Create course → appears in course list □ Add lesson → appears in lesson manager, reorder drag-and-drop works □ Upload PDF → appears in documents list with "Pending" badge □ "Process for AI" → status changes to "Ready", chunksCount populated in MongoDB □ Lead status change → badge updates □ Export CSV → file downloads with correct data □ Block student → student cannot login □ Approve testimonial → appears on public testimonials page STUDENT: □ Dashboard shows enrolled courses + progress bars □ Course player loads video iframe, sidebar shows lesson list □ Mark lesson complete → progress bar updates □ AI Chat: type question → streaming response appears → session saved in MongoDB □ Profile photo upload works, name change saved AI CHATBOT: □ Chat with no documents processed → returns "not in materials" message □ Chat after document processed → returns relevant answer from document content □ Course context filter works (asking about Course 1 doesn't return Course 2 chunks)_

**Quick Reference: MongoDB Collections**

| **users**           | { name, email, password(hashed), phone, role, enrollments:\[courseId\], avatar, isBlocked, resetToken, resetExpiry, createdAt } |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **courses**         | { title, slug(unique), instructor, description, shortDescription, thumbnail, duration, level, status, createdAt }               |
| **lessons**         | { courseId, sectionName, title, order, videoUrl, description, resources:\[docId\], duration, isFreePreview }                    |
| **leads**           | { name, phone, email, courseInterest, preferredTime, message, status, notes:\[{text,addedAt}\], createdAt }                     |
| **testimonials**    | { studentId, studentName, courseId, rating, review, status, featured, createdAt }                                               |
| **coursedocuments** | { courseId, name, filePath, fileType, size, processedForAI, chunksCount, processingError, uploadedAt }                          |
| **documentchunks**  | { documentId, courseId, filename, chunkIndex, text, embedding:\[1536 floats\] } ← Atlas Vector Search on embedding              |
| **chatsessions**    | { userId, title, courseIds:\[...\], messages:\[{role,content,timestamp}\], createdAt }                                          |
| **lessonquestions** | { lessonId, userId, question, answer, askedAt }                                                                                 |
| **progresses**      | { userId, courseId, completedLessons:\[lessonId\], percentComplete, lastAccessed }                                              |

**Scope Changes vs Original PRD**

| **REMOVED: Firebase**        | No Firebase at all. Auth = JWT. DB = MongoDB. Storage = local/Cloudinary.          |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| **REMOVED: Google OAuth**    | Simple email+password only. bcrypt + JWT.                                          |
| **REMOVED: Pinecone**        | MongoDB Atlas Vector Search used instead - same DB, zero extra cost.               |
| **REMOVED: Payment Gateway** | No Razorpay/Stripe. All CTAs → lead capture form (offline coaching).               |
| **REMOVED: Certificate PDF** | Not needed for offline coaching.                                                   |
| **ADDED: Lead CRM**          | Full status pipeline: New → Contacted → Visit Scheduled → Enrolled → Closed.       |
| **ADDED: AI Chatbot (RAG)**  | Admin uploads docs → vector-indexed in MongoDB → Claude answers student questions. |
| **ADDED: Progress Tracking** | Per-lesson completion stored in MongoDB, shown as progress bars.                   |
| **MODIFIED: File Storage**   | Multer saves to /backend/uploads/ (local dev), configure Cloudinary/S3 for prod.   |
| **MODIFIED: Email**          | Nodemailer with Gmail App Password - no third-party email service needed.          |