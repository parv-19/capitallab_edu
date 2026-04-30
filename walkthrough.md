# Capital Lab Project Walkthrough

The Capital Lab platform is now fully implemented! This walkthrough covers the high-fidelity UI elements, dashboard functionalities, and a deep dive into the premium RAG-based AI Chatbot architecture.

## 1. Public Facing Pages
The public frontend features a premium Navy and Gold design system, tailored specifically for offline education.
- **Home & About:** Dynamic layouts with optimized routing.
- **Courses (/courses):** A horizontally scrollable list of available courses with modal-based lead generation forms.
- **Course Detail (/courses/[slug]):** A tabbed layout showcasing the syllabus, instructor details, and a sticky enrollment sidebar.
- **Testimonials (/testimonials):** A filterable masonry grid to showcase student success stories.
- **Authentication:** Fully functional Login, Signup (with password strength validation), and Password Reset flows.

## 2. Admin & Student Dashboards
The dashboards operate independently with role-based layouts and data fetching logic.

### Admin Dashboard (Navy Theme)
- **Leads CRM:** A robust tabular interface with advanced filtering, status toggling, CSV exports, and a slide-over notes drawer.
- **Course & Lesson Management:** Complete CRUD operations for courses and an intuitive HTML5 drag-and-drop system for lesson reordering.
- **Document Hub:** Drag-and-drop file upload zone equipped with an "AI Processing" pipeline to convert PDFs/DOCX into searchable chunks.
- **Student Management:** Features for manual course enrollment and blocking/unblocking students.
- **Testimonial Moderation:** A workflow to approve, reject, or feature student reviews.

### Student Dashboard (Indigo Theme)
- **Dashboard Home:** Progress tracking, stat cards, and dynamic motivational quotes.
- **Course Player:** A comprehensive video player with a syllabus accordion sidebar, "Mark Complete" functionality, and direct Q&A submission to instructors.
- **Profile Management:** Avatar uploads, password updates, and account management.

---

## 3. Premium Feature: The RAG-Based AI Chatbot 🤖

The standout feature of the student experience is the fully integrated AI Study Assistant. It utilizes a **Retrieval-Augmented Generation (RAG)** architecture to provide highly contextual answers strictly based on the admin-uploaded course materials.

### How It Works:

1. **Document Ingestion (Admin Side):**
   - Admins upload course materials (PDF, DOCX, TXT) via the Document Hub.
   - The backend processes these using `multer` for storage, `mammoth` (for DOCX), and `pdf-parse` (for PDFs) to extract raw text.
   - We use LangChain's `RecursiveCharacterTextSplitter` to break the text into optimal, overlapping chunks (800 characters with 100 overlap).
   - Each chunk is embedded using OpenAI's `text-embedding-3-small` model and stored in MongoDB.

2. **Context Retrieval (Student Side):**
   - When a student asks a question (e.g., "Summarise Chapter 1"), the backend embeds the query using OpenAI.
   - We use MongoDB Atlas `$vectorSearch` to perform a highly efficient similarity search against the embedded chunks, strictly filtering by the courses the student is actually enrolled in.

3. **Streaming Generation:**
   - The top 6 most relevant text chunks are extracted and bundled into a system prompt.
   - We instruct Claude (`claude-opus-4-5`) to act as the Capital Lab study assistant, answering **only** from the provided context chunks. If the answer isn't in the material, Claude is instructed to politely direct the student to their instructor.
   - The response is streamed back to the frontend chunk-by-chunk using Server-Sent Events (SSE) and the Fetch `ReadableStream` API, resulting in a fast, typewriter-like chat experience.

> [!TIP]
> **Enrollment Guard:** The system enforces strict access control. Students can dynamically select which enrolled course they want to query via the UI dropdown, and the backend verifies these permissions before performing the vector search.

> [!IMPORTANT]
> **Vector Search Index:** To enable the RAG pipeline, you must create a Vector Search Index in your MongoDB Atlas cluster named `document_chunks_vector_index` mapping to the `embedding` array on the `DocumentChunk` collection.

---

## Next Steps to Go Live
1. Run `npm run dev` in the `/frontend` directory to preview the UI on `localhost:3000`.
2. Configure your `document_chunks_vector_index` in MongoDB Atlas.
3. Start the backend with `npm run dev` in the `/backend` directory to activate the data flows.
