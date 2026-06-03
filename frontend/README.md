# Capital Lab Education Frontend

Next.js frontend for the Capital Lab Education platform. This app powers the public marketing website, the authentication experience, the student dashboard, and the admin panel for managing leads, courses, students, testimonials, and course content.

The project is built with the Next.js App Router, React, TypeScript, Tailwind CSS, and Axios.

## Overview

This frontend has four main parts:

1. Public marketing website
   The homepage is based on the approved `index.html` design and uses the provided assets `LOGO.PNG`, `instructor_harsh.jpg`, and `instructor_parth.jpg`.

2. Authentication
   Includes login, signup, forgot-password, and reset-password flows. Authentication state is managed client-side with token persistence in `localStorage` and refresh handling through the backend.

3. Student area
   Students can access their dashboard, enrolled courses, AI study chat, and profile.

4. Admin area
   Admins can manage leads, courses, students, testimonials, settings, and course lesson/document sections.

## Tech Stack

- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS
- Axios
- Framer Motion
- Lucide React
- Sonner
- Vercel Analytics
- Vercel Speed Insights

## Project Structure

```text
app/
  page.tsx                        Public homepage
  about/page.tsx                  About page
  courses/page.tsx                Programs listing page
  courses/[slug]/page.tsx         Course detail page
  testimonials/page.tsx           Testimonials page
  login/page.tsx                  Login page
  signup/page.tsx                 Signup page
  forgot-password/page.tsx        Forgot-password page
  reset-password/page.tsx         Password reset page
  student/                        Student dashboard area
  admin/                          Admin dashboard area
  api/site-assets/                Logo and instructor asset routes

components/
  home/ApprovedLandingPage.tsx    Approved homepage UI integration
  layout/                         Shared marketing navbar/footer
  ui/LeadForm.tsx                 Reusable enquiry form
  student/                        Student-facing UI pieces

contexts/
  AuthContext.tsx                 App-wide auth state and actions

lib/
  axios.ts                        Shared API client with auth interceptors
  auth.ts                         Auth API methods
  site-content.ts                 Static marketing content/fallback content
  server/site-assets.ts           Asset loading from `public/`

public/
  LOGO.PNG
  instructor_harsh.jpg
  instructor_parth.jpg

types/
  index.ts                        Shared app types
```

## Features

### Public Website

- Approved landing page UI on `/`
- Exact approved homepage visual structure adapted into Next.js
- Anchor-based homepage navigation
- Login or Dashboard button in the homepage navbar
- Mobile navigation drawer
- Testimonials slider
- Program accordions
- Inline and popup enquiry forms
- Separate public pages for About, Courses, and Testimonials

### Authentication

- Login with role-based redirect
- Signup with validation
- Forgot-password flow
- Reset-password flow
- Access token stored in `localStorage`
- Automatic token refresh on `401`
- Redirect to `/login` if refresh fails

### Student Dashboard

- Dashboard landing page
- My Courses
- Course detail page
- AI Study Chat
- Profile

### Admin Dashboard

- Dashboard overview
- Leads management
- Courses management
- Lessons management
- Course documents page
- Students management
- Testimonials management
- Settings

## Environment Variables

Create `.env.local` from `.env.example`.

### Required Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Meaning

- `NEXT_PUBLIC_API_URL`
  Base URL for the backend API used by Axios.

- `NEXT_PUBLIC_SITE_URL`
  Public site URL used in metadata, Open Graph tags, sitemap generation, and related SEO output.

## Getting Started

### Prerequisites

- Node.js 18 or later recommended
- npm
- A running Capital Lab backend API

### Install Dependencies

```bash
npm install
```

### Configure Environment

```bash
cp .env.example .env.local
```

On Windows PowerShell, create `.env.local` manually if `cp` is not available.

### Run Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

### Production Build

```bash
npm run build
npm run start
```

Use the production server for realistic performance checks. `next dev` is intentionally slower because routes compile on demand.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Routing Summary

### Public Routes

- `/`
- `/about`
- `/courses`
- `/courses/[slug]`
- `/testimonials`
- `/login`
- `/signup`
- `/forgot-password`
- `/reset-password`

### Student Routes

- `/student`
- `/student/courses`
- `/student/courses/[courseId]`
- `/student/chat`
- `/student/profile`

### Admin Routes

- `/admin`
- `/admin/leads`
- `/admin/courses`
- `/admin/courses/[courseId]/lessons`
- `/admin/courses/[courseId]/documents`
- `/admin/students`
- `/admin/testimonials`
- `/admin/settings`

## Authentication Flow

Authentication is implemented through:

- [contexts/AuthContext.tsx](/d:/capitallab/frontend/contexts/AuthContext.tsx)
- [lib/auth.ts](/d:/capitallab/frontend/lib/auth.ts)
- [lib/axios.ts](/d:/capitallab/frontend/lib/axios.ts)

### How It Works

1. User logs in or signs up.
2. Backend returns `accessToken` and user payload.
3. Frontend stores the token in `localStorage` under `capitalLabAccessToken`.
4. Axios attaches the bearer token to future requests.
5. On `401`, Axios attempts `/auth/refresh`.
6. If refresh succeeds, the original request is retried.
7. If refresh fails, the token is cleared and the user is redirected to `/login`.

### Role-Based Redirects

- Admin users are redirected to `/admin`
- Student users are redirected to `/student`

## Homepage Implementation Notes

The homepage is intentionally different from the rest of the public routes.

### Why

The client approved a specific static design in root-level `index.html`. Instead of rewriting that design loosely, the homepage implementation loads the approved structure and adapts it for the live app.

### Files Involved

- [app/page.tsx](/d:/capitallab/frontend/app/page.tsx)
- [components/home/ApprovedLandingPage.tsx](/d:/capitallab/frontend/components/home/ApprovedLandingPage.tsx)

### What the Homepage Layer Does

- Reads the approved root `index.html`
- Extracts the approved `<style>` block and body markup
- Rewrites image paths to use the real app assets
- Injects a real `Login` or `Dashboard` button into the approved navbar
- Replaces placeholder CTA behavior with real lead-form behavior
- Powers accordions, popup, mobile nav, and testimonials on the client

### Asset Source

The homepage uses:

- `/LOGO.PNG`
- `/instructor_harsh.jpg`
- `/instructor_parth.jpg`

These live in `public/`.

## Site Asset Endpoints

The app exposes image routes for existing pages that still reference API-based branding assets:

- `/api/site-assets/logo`
- `/api/site-assets/instructor`

These now read from real files in `public/` through:

- [lib/server/site-assets.ts](/d:/capitallab/frontend/lib/server/site-assets.ts)

## Domain Model

Shared types live in [types/index.ts](/d:/capitallab/frontend/types/index.ts).

Main entities:

- `User`
- `Course`
- `Lesson`
- `Lead`
- `Testimonial`
- `CourseDocument`
- `ChatMessage`
- `ChatSession`
- `Enrollment`

## API Expectations

This frontend expects a backend exposing endpoints like:

- `POST /auth/login`
- `POST /auth/signup`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/refresh`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /leads`
- `GET /courses`
- `GET /testimonials`

Additional admin and student endpoints are also expected for dashboard data, course access, documents, and chat functionality.

## Styling

- Global styles live in [app/globals.css](/d:/capitallab/frontend/app/globals.css)
- Tailwind config lives in `tailwind.config.ts`
- The homepage also injects approved page-level CSS directly from the root `index.html` source

## SEO and Metadata

Configured in:

- [app/layout.tsx](/d:/capitallab/frontend/app/layout.tsx)
- [app/sitemap.ts](/d:/capitallab/frontend/app/sitemap.ts)
- [app/robots.ts](/d:/capitallab/frontend/app/robots.ts)

Includes:

- Metadata base URL
- Title template
- Description and keywords
- Open Graph fields
- Robots settings
- Sitemap

## Troubleshooting

### Blank Page in Dev

If a route opens as a white page in local development:

1. Stop the dev server
2. Delete `.next`
3. Restart with `npm run dev`

This is usually caused by stale or broken development artifacts.

### Dev Mode Feels Slow

This is expected to some degree with `next dev`, especially on first route load.

Reasons:

- App Router routes compile on demand
- Windows file watching can be slower
- Large route trees and client bundles increase first-hit compile time

For realistic performance, test with:

```bash
npm run build
npm run start
```

### Login Page Looks Blank but HTML Exists

If HTML is present but the page looks blank, it is usually a client-side hydration or dev-runtime issue rather than a missing route.

### API Requests Fail

Check:

- `NEXT_PUBLIC_API_URL`
- Backend server availability
- CORS settings
- Auth refresh endpoint behavior

## Recommended Development Workflow

1. Start the backend API first
2. Start the frontend with `npm run dev`
3. Use the public homepage for marketing review
4. Use `/login` for auth verification
5. Use production mode when checking real performance

## Notes for Future Changes

- The homepage is intentionally tied to the approved `index.html` source and should be updated carefully.
- The public About, Courses, and Testimonials pages are still separate React pages and are not yet exact clones of the homepage visual language.
- Existing auth behavior should be preserved when making UI changes.
- If branding assets change, update both `public/` files and any route references that depend on `/api/site-assets/*`.

## Status

Current implementation includes:

- Approved homepage integrated into the live app
- Real login/dashboard button in homepage navbar
- Auth flows preserved
- Student and admin areas intact
- Production build passing
