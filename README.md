# Merry Match

> A full-stack matchmaking web application built with Next.js, Prisma, Supabase, and Omise.

Merry Match is a dating and matchmaking platform with a public landing page, user authentication, profile creation, swipe-based matching, real-time chat, membership management, payment flows, notifications, complaints, and an admin area for package management.

## Table of Contents

- [About the Project](#about-the-project)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Database Setup](#database-setup)
- [Available Scripts](#available-scripts)
- [Main Routes](#main-routes)
- [API Highlights](#api-highlights)
- [Development Notes](#development-notes)

## About the Project

This repository contains a **Pages Router** Next.js application for a matchmaking product. It combines:

- a marketing landing page
- user registration and login
- profile setup with photos and preferences
- swipe and match flows
- real-time chat
- subscription and payment flows
- notifications and complaints
- admin tools for managing membership packages

The codebase follows a layered structure with `pages`, `controllers`, `services`, and `repositories`, while Prisma models the PostgreSQL schema.

## Key Features

- Landing page with product sections and call-to-action flow
- Multi-step registration with profile details, interests, and photo upload
- Login flow backed by Supabase auth/session handling
- Swipe-based matching with filters and daily/package-based limits
- Match list and real-time chat
- Membership page with billing history and cancellation flow
- Payment checkout with Omise card and QR payment support
- Notification feed and profile popup interactions
- Complaint reporting flow
- Admin panel for merry package management and complaint handling

## Tech Stack

**Frontend**

- Next.js 16
- React 19
- Tailwind CSS 4
- Framer Motion
- Shadcn UI / custom UI components

**Backend / Data**

- Next.js API Routes
- Prisma ORM
- PostgreSQL
- Supabase

**Payments**

- Omise

## Project Structure

```text
.
├── prisma/
│   └── schema.prisma
├── public/
├── src/
│   ├── components/
│   ├── contexts/
│   ├── controllers/
│   ├── hooks/
│   ├── lib/
│   ├── middlewares/
│   ├── pages/
│   ├── providers/
│   ├── repositories/
│   ├── services/
│   └── styles/
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

Before running the project, make sure you have:

- Node.js LTS installed
- npm installed
- a PostgreSQL database available
- Supabase project credentials
- Omise keys if you want to use the real payment flow

### Installation

```bash
git clone <your-repository-url>
cd merry-match
npm install
```

### Run the app

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Database Setup

This repository includes a Prisma schema at `prisma/schema.prisma`, but Prisma migrations are not committed in the current repo state.

If you are connecting to an existing database that already matches the schema:

```bash
npx prisma generate
```

If you are starting from a fresh development database, review the schema first and then apply your preferred Prisma workflow, for example:

```bash
npx prisma generate
npx prisma db push
```

If your team uses migrations, add and manage them before sharing the environment with others.

## Available Scripts

- `npm run dev` starts the development server
- `npm run build` generates Prisma client and builds the Next.js app
- `npm run start` starts the production server
- `npm run lint` runs ESLint

## Main Routes

**User-facing pages**

- `/` landing page
- `/login` login page
- `/register` multi-step registration flow
- `/matchingpage` swipe and match interface
- `/merry-list` match list
- `/merry-to-you` incoming interactions
- `/chat/[roomId]` real-time chat room
- `/profile` user profile
- `/payment` package selection
- `/payment/checkout` checkout flow
- `/payment/success` payment success page
- `/payment/failed` payment failed page
- `/membership` active membership and billing history
- `/complaint` complaint submission

**Admin pages**

- `/admin/login`
- `/admin/merry-package`
- `/admin/complaint`

## API Highlights

Some important API routes in this project:

- `/api/auth/register`
- `/api/auth/login`
- `/api/matching/profiles`
- `/api/matching/swipe`
- `/api/matching/matches`
- `/api/chat/rooms`
- `/api/chat/rooms/[roomId]/messages`
- `/api/membership/me`
- `/api/membership/history`
- `/api/membership/cancel`
- `/api/merry-packages/pay-card`
- `/api/merry-packages/pay-qr`
- `/api/webhook/payment`
- `/api/notifications`
- `/api/admin/merry-package`
- `/api/admin/complaint`

## Development Notes

- The app uses the Next.js **Pages Router**, not the App Router.
- Path aliases are configured via `@/* -> ./src/*`.
- Supabase storage images are allowed through `next.config.mjs`.
- Prisma is configured through `prisma.config.ts`.
- The current repo includes a committed `.env` file with real-looking credentials. For safety, move secrets out of version control and rotate exposed keys before deploying or sharing the project.
- There is no automated test suite configured in `package.json` at the moment.
