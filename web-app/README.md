# Web App - 26_SCARP_EduVideo

The front-end component of the EduVideo system. Provides the user interface for uploading course materials and viewing AI-generated instructional videos.

## Overview

Allows instructors and students to interact with the EduVideo pipeline — submit written CS course content (lecture slides, notes, handouts, example code) and access the resulting short teaching videos on topics like loops, recursion, data structures, and algorithms.

## Tech Stack (TBD)

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | SQLite + Prisma ORM |
| Validation | Zod |
| Dev Tools | ESLint, Prettier |

## Project Structure (TBD)

```
web-app/
├── app/
│   ├── page.tsx                   # Home / landing
│   ├── generate/
│   │   └── page.tsx               # Video generation form
│   ├── gallery/
│   │   └── page.tsx               # Browse & filter videos
│   └── api/
│       ├── generate/route.ts      # Submit generation request
│       ├── jobs/[id]/route.ts     # Poll job status
│       ├── videos/route.ts        # Fetch video list
│       └── feedback/route.ts      # Thumbs up/down
├── components/                    # Reusable UI components
├── lib/                           # DB client, helpers, types
├── prisma/
│   └── schema.prisma              # Data models
└── public/videos/                 # Generated video files
```

## Job Tracking

Video generation is asynchronous. The web app and video engine share a SQLite database as a job queue:

```
User submits → job row created (status: pending)
             → video-engine picks up job (status: processing)
             → pipeline runs
             → job updated (status: done | failed)

Frontend polls GET /api/jobs/[id] every few seconds to display progress.
```

SQLite is run in WAL mode to support concurrent reads/writes between the web app (Node.js) and video engine (Python).

## Data Models and Database Design (TBD)

```
jobs      — id, status, input_path, video_path, error, created_at, updated_at
videos    — id, title, topic, tags, length, video_path, created_at
feedback  — id, video_id, thumbs_up, created_at
```

## Getting Started

```bash
npm install
npx prisma migrate dev
npm run dev
```