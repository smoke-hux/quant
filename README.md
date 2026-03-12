# Trumpet Courts

Internal project management platform with role-based access control, work scheduling, and Excel/document management.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Auth:** NextAuth.js v5
- **Database:** SQLite via Prisma ORM
- **UI:** Tailwind CSS, Radix UI, shadcn/ui, Recharts
- **Language:** TypeScript

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL, NEXTAUTH_SECRET, and OAuth credentials if needed

# Push database schema
npm run prisma:push

# Seed the database (optional)
npm run prisma:seed

# Start dev server
npm run dev
```

## Features

- **Admin dashboard** — user management, activity logs, work schedules, project oversight
- **Project management** — create/assign Excel projects with document attachments
- **Work scheduling** — configurable per-day work hours with admin override capability
- **Access requests** — users can request access; admins approve/deny
- **Activity logging** — tracks logins, file uploads, edits, and downloads

## Google OAuth Setup

To enable Google sign-in, add these values to `.env`:

```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXTAUTH_URL=http://localhost:3000
```

In the Google Cloud console, configure:

- **Authorized JavaScript origin:** `http://localhost:3000`
- **Authorized redirect URI:** `http://localhost:3000/api/auth/callback/google`
