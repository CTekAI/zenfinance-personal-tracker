# ZenFinance - Personal Finance Tracker

## Overview

ZenFinance is a full-stack personal finance tracking application built with React, TypeScript, and Express. It provides a dashboard-driven interface for managing income, expenses, savings, debt, and wishlists. The app includes dual authentication (custom email/password and Replit Auth) and an AI financial advisor powered by Google's Gemini API.

Financial data is persisted in a PostgreSQL database with per-user isolation. Authentication supports custom email/password sign-up/sign-in (via modal forms) as well as Replit's OpenID Connect integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **Feb 2026**: Added custom email/password authentication with sign-up and sign-in modals. Passwords hashed with bcrypt. Dual auth system supports both email/password and Replit Auth (OpenID Connect).
- **Feb 2026**: Added user authentication (Replit Auth) and migrated from localStorage to PostgreSQL database. Each user now has their own isolated financial data. Added landing page for logged-out users.

## System Architecture

### Frontend Architecture
- **Framework**: React 19 with TypeScript, bundled by Vite
- **Styling**: Tailwind CSS loaded via CDN (`cdn.tailwindcss.com`), plus a custom `index.css` file. Font is Inter from Google Fonts.
- **Routing**: No router library — tab-based navigation managed via React state (`activeTab`). Tabs include Dashboard, Income, Expenses, Savings, Debt, Wishlist, and AI Advisor.
- **State Management**: All finance data lives in a single `FinanceData` state object in `App.tsx`, passed down as props to child components. Auth state managed via `useAuth` hook from `@tanstack/react-query`.
- **Data Persistence**: PostgreSQL database via Express API. Data is loaded on login via `GET /api/finance` and updated per-operation via individual CRUD endpoints.
- **Charts**: Recharts library for data visualization (pie charts on the Dashboard).
- **Icons**: Lucide React icon library.

### Backend Architecture
- **Server**: Express on port 3001, proxied by Vite dev server on port 5000
- **Database**: PostgreSQL (Neon-backed) via Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect) with Passport.js, session-based auth stored in PostgreSQL
- **API**: RESTful CRUD endpoints under `/api/finance/*`, all protected by `isAuthenticated` middleware

### File Structure
- `App.tsx` — Root component with auth gating, sidebar navigation, and tab switching
- `index.tsx` — React DOM entry point with QueryClientProvider
- `types.ts` — TypeScript interfaces for all data models
- `constants.ts` — Category lists
- `components/` — One component per tab:
  - `LandingPage.tsx` — Landing page for logged-out users
  - `Dashboard.tsx` — Overview with summary cards and spending pie chart
  - `IncomeTracker.tsx` — CRUD for income sources (API-backed)
  - `OutgoingsTracker.tsx` — CRUD for expenses (API-backed)
  - `SavingsTracker.tsx` — Savings accounts with deposit functionality (API-backed)
  - `DebtTracker.tsx` — Debt tracking with payments (API-backed)
  - `WishlistTracker.tsx` — Wishlist items with saving progress (API-backed)
  - `AIAdvisor.tsx` — Chat interface with Gemini AI
- `server/` — Backend:
  - `index.ts` — Express server entry point
  - `routes.ts` — All finance CRUD API routes
  - `db.ts` — Database connection (Drizzle + Neon)
  - `replit_integrations/auth/` — Replit Auth module (DO NOT MODIFY)
- `shared/` — Shared between client and server:
  - `schema.ts` — Re-exports all Drizzle schemas
  - `models/auth.ts` — Users and sessions tables
  - `models/finance.ts` — Finance data tables (income, outgoings, savings, debt, wishlist)
- `client/src/` — Client utilities:
  - `hooks/use-auth.ts` — React hook for auth state
  - `lib/api.ts` — API helper functions for all CRUD operations
  - `lib/auth-utils.ts` — Auth error handling utilities

### Database Schema
PostgreSQL tables (all finance tables include `userId` for per-user isolation):
- `users` — Replit Auth user accounts
- `sessions` — Session storage for auth
- `income` — Income sources (source, amount, category, frequency)
- `outgoings` — Expenses (description, amount, category, date, frequency)
- `savings` — Savings accounts (name, balance, target, category)
- `debt` — Debt items (name, balance, interest rate, min payment, priority, deadline)
- `wishlist` — Wishlist items (item, cost, saved, priority, deadline)

### Build & Dev Setup
- **Vite** dev server runs on port 5000, host `0.0.0.0`, proxies `/api` to Express on port 3001
- **Express** API server runs on port 3001
- Both started concurrently via `npm run dev` using `concurrently`
- Path aliases: `@/*` maps to project root, `@shared/*` maps to `shared/`
- Database migrations: `npm run db:push` (Drizzle Kit)
- Environment variables: `GEMINI_API_KEY` in `.env.local`, `DATABASE_URL` and `SESSION_SECRET` from Replit

### Key Design Decisions
1. **Per-user database storage**: All financial data is stored in PostgreSQL with `userId` column for isolation. Each user only sees their own data.
2. **Replit Auth**: Authentication via OpenID Connect. No custom login forms — users click "Sign In" which redirects to `/api/login`.
3. **Single state object**: Finance data is fetched as one `FinanceData` object and passed to components. Individual CRUD operations call the API and update local state.
4. **AI runs client-side**: The Gemini API is called directly from the browser. The API key is embedded at build time.
5. **Tailwind via CDN**: Not using PostCSS/Tailwind build pipeline.

## External Dependencies

### NPM Packages
- `react` / `react-dom` (v19) — UI framework
- `@tanstack/react-query` — Server state management (auth hook)
- `recharts` (v3.7) — Charting library
- `lucide-react` (v0.563) — Icon library
- `@google/genai` (v1.39) — Google Gemini AI SDK
- `express` (v5) — Backend server
- `drizzle-orm` / `drizzle-kit` — Database ORM and migrations
- `@neondatabase/serverless` — PostgreSQL driver
- `passport` / `openid-client` — Authentication
- `express-session` / `connect-pg-simple` — Session management
- `concurrently` — Run multiple scripts
- `tsx` — TypeScript execution for server
- `vite` (v6.2) + `@vitejs/plugin-react` — Build tooling

### External APIs
- **Google Gemini API** — Powers the AI financial advisor chat
- **Replit Auth** — OpenID Connect authentication provider

### CDN Resources
- Tailwind CSS via `cdn.tailwindcss.com`
- Inter font from Google Fonts
