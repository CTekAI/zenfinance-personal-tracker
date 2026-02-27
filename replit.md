# ZenFinance - Personal Finance Tracker

## Overview

ZenFinance is a full-stack personal finance tracking application built with React, TypeScript, and Express. It provides a dashboard-driven interface for managing income, expenses, savings, debt, wishlists, bank accounts, daily spending, and notifications. The app includes dual authentication (custom email/password and Replit Auth) and an AI financial advisor powered by OpenAI.

Financial data is persisted in a PostgreSQL database with per-user isolation. Authentication supports custom email/password sign-up/sign-in (via modal forms) as well as Replit's OpenID Connect integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **Feb 2026**: Major overhaul — per-item currency on all trackers (income, expenses, savings, debt, wishlist), day-of-month selectors for recurring items, category colors/icons for expenses, expense filters, simplified savings pots, dashboard "This Month at a Glance" with income/outgoing/savings/available cards, upcoming expenses, month-on-month trend graph, quick daily spending log, notification center (bell icon with bill reminders and savings milestones), cross-page data sync (account deductions on debt payments and savings deposits), enhanced AI advisor with real spending patterns and multi-currency context, profile picture upload fix.
- **Feb 2026**: Added multi-currency support (USD, GBP, EUR, IDR) with per-user currency preference stored in database. Currency selector in app header. All components use `formatCurrency()` helper with `Intl.NumberFormat`.
- **Feb 2026**: Added bank accounts management system. New `accounts` table with CRUD API routes. AccountsTracker component supports add/edit/delete with per-account currency. Dashboard Total Capital now uses account balances when available.
- **Feb 2026**: Added custom email/password authentication with sign-up and sign-in modals. Passwords hashed with bcrypt. Dual auth system supports both email/password and Replit Auth (OpenID Connect).
- **Feb 2026**: Added user authentication (Replit Auth) and migrated from localStorage to PostgreSQL database. Each user now has their own isolated financial data. Added landing page for logged-out users.

## System Architecture

### Frontend Architecture
- **Framework**: React 19 with TypeScript, bundled by Vite
- **Styling**: Tailwind CSS loaded via CDN (`cdn.tailwindcss.com`), plus a custom `index.css` file. Font is Inter from Google Fonts.
- **Routing**: No router library — tab-based navigation managed via React state (`activeTab`). Tabs include Dashboard, Income, Expenses, Savings, Debt, Spending, Accounts, Wishlist, AI Advisor, and Profile.
- **State Management**: All finance data lives in a single `FinanceData` state object in `App.tsx`, passed down as props to child components. Auth state managed via `useAuth` hook from `@tanstack/react-query`.
- **Data Persistence**: PostgreSQL database via Express API. Data is loaded on login via `GET /api/finance` and updated per-operation via individual CRUD endpoints.
- **Charts**: Recharts library for data visualization (pie chart and line chart on Dashboard).
- **Icons**: Lucide React icon library.

### Backend Architecture
- **Server**: Express on port 3001, proxied by Vite dev server on port 5000
- **Database**: PostgreSQL (Neon-backed) via Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect) with Passport.js + custom email/password auth, session-based auth stored in PostgreSQL
- **API**: RESTful CRUD endpoints under `/api/finance/*`, all protected by `isAuthenticated` middleware

### File Structure
- `App.tsx` — Root component with auth gating, sidebar navigation, and tab switching
- `index.tsx` — React DOM entry point with QueryClientProvider
- `types.ts` — TypeScript interfaces for all data models (IncomeItem, OutgoingItem, SavingsItem, DebtItem, WishlistItem, AccountItem, SpendingLogItem, NotificationItem)
- `constants.ts` — Category lists, CATEGORY_COLORS, CATEGORY_ICONS, DAY_OF_MONTH_OPTIONS, SPENDING categories
- `components/` — One component per tab:
  - `LandingPage.tsx` — Landing page for logged-out users
  - `Dashboard.tsx` — "This Month at a Glance" with summary cards, upcoming expenses, spending pie chart, income vs expenses trend graph, multi-currency account balances
  - `IncomeTracker.tsx` — CRUD for income sources with per-item currency, dynamic labels by frequency, day-of-month selector, currency totals
  - `OutgoingsTracker.tsx` — CRUD for expenses with per-item currency, monthly/one-off toggle, category colors/icons, filter panel (category + date range), currency totals
  - `SavingsTracker.tsx` — Simplified per-currency savings pots with deposit, account deduction on deposit
  - `DebtTracker.tsx` — Debt tracking with per-item currency, payments with account deduction, min payment tooltips
  - `WishlistTracker.tsx` — Wishlist items with per-item currency, saving progress, currency totals
  - `SpendingLog.tsx` — Quick daily spending entry with category, running daily totals
  - `AccountsTracker.tsx` — Bank accounts management with per-account currency
  - `NotificationPanel.tsx` — Bell icon dropdown with unread count, bill due reminders, savings milestones
  - `AIAdvisor.tsx` — Chat interface with OpenAI
  - `Profile.tsx` — User profile (photo upload with local preview, name editing, password change)
  - `AuthModal.tsx` — Sign up/sign in modal for email/password auth
- `server/` — Backend:
  - `index.ts` — Express server entry point
  - `routes.ts` — All finance CRUD API routes, spending log routes, notification routes with auto-generation
  - `auth.ts` — Custom email/password auth routes and profile endpoints
  - `ai.ts` — AI financial advisor route (POST /api/ai/advice) using OpenAI with full financial snapshot including spending patterns, multi-currency data, upcoming bills
  - `db.ts` — Database connection (Drizzle + Neon)
  - `replit_integrations/auth/` — Replit Auth module (DO NOT MODIFY)
- `shared/` — Shared between client and server:
  - `schema.ts` — Re-exports all Drizzle schemas
  - `models/auth.ts` — Users and sessions tables
  - `models/finance.ts` — Finance data tables (income, outgoings, savings, debt, wishlist, accounts, spendingLog, notifications)
- `client/src/` — Client utilities:
  - `hooks/use-auth.ts` — React hook for auth state
  - `lib/api.ts` — API helper functions for all CRUD operations, spending log, notifications, account deduction
  - `lib/currency.ts` — Currency formatting utilities (formatCurrency, CURRENCIES, CurrencyCode)
  - `lib/auth-utils.ts` — Auth error handling utilities

### Database Schema
PostgreSQL tables (all finance tables include `userId` for per-user isolation):
- `users` — User accounts (email/password or Replit Auth)
- `sessions` — Session storage for auth
- `income` — Income sources (source, amount, category, frequency, currency, dayOfMonth)
- `outgoings` — Expenses (description, amount, category, date, frequency, currency, dayOfMonth, isRecurring)
- `savings` — Savings pots (name, balance, target, category, currency)
- `debt` — Debt items (name, balance, interest rate, min payment, priority, deadline, currency)
- `wishlist` — Wishlist items (item, cost, saved, priority, deadline, currency)
- `accounts` — Bank accounts (name, balance, currency, type)
- `spending_log` — Quick daily spending entries (description, amount, currency, category, date)
- `notifications` — User notifications (type, title, message, read, relatedId)

### Build & Dev Setup
- **Vite** dev server runs on port 5000, host `0.0.0.0`, proxies `/api` to Express on port 3001
- **Express** API server runs on port 3001
- Both started concurrently via `npm run dev` using `concurrently`
- Path aliases: `@/*` maps to project root, `@shared/*` maps to `shared/`
- Database migrations: `npm run db:push` (Drizzle Kit)
- Environment variables: `DATABASE_URL` and `SESSION_SECRET` from Replit, `OPENAI_API_KEY` as secret

### Key Design Decisions
1. **Per-user database storage**: All financial data is stored in PostgreSQL with `userId` column for isolation. Each user only sees their own data.
2. **Dual auth**: Custom email/password + Replit Auth (OpenID Connect). Users can sign up/in via modal forms or Replit.
3. **Single state object**: Finance data is fetched as one `FinanceData` object and passed to components. Individual CRUD operations call the API and update local state.
4. **AI runs server-side**: The OpenAI API is called from the Express backend via POST /api/ai/advice. The API key is stored as a secret (OPENAI_API_KEY). Uses real user data including spending patterns, multi-currency balances, and upcoming bills.
5. **Tailwind via CDN**: Not using PostCSS/Tailwind build pipeline.
6. **No currency conversion**: Multi-currency amounts displayed in their own currency. Totals shown as separate per-currency pills/groups.
7. **Spending log vs Expenses**: Spending log is for quick daily entries (coffee, food). Expenses are recurring/planned monthly bills.
8. **Savings vs Wishlist**: Savings are simplified per-currency pots. Specific savings goals go in Wishlist.
9. **Cross-page sync**: Debt payments and savings deposits can optionally deduct from a bank account, keeping balances synchronized.

## External Dependencies

### NPM Packages
- `react` / `react-dom` (v19) — UI framework
- `@tanstack/react-query` — Server state management (auth hook)
- `recharts` (v3.7) — Charting library (PieChart, LineChart)
- `lucide-react` (v0.563) — Icon library
- `openai` — OpenAI SDK for AI financial advisor
- `express` (v5) — Backend server
- `drizzle-orm` / `drizzle-kit` — Database ORM and migrations
- `@neondatabase/serverless` — PostgreSQL driver
- `passport` / `openid-client` — Authentication
- `express-session` / `connect-pg-simple` — Session management
- `concurrently` — Run multiple scripts
- `tsx` — TypeScript execution for server
- `vite` (v6.2) + `@vitejs/plugin-react` — Build tooling

### External APIs
- **OpenAI API** — Powers the AI financial advisor chat (user's own API key via OPENAI_API_KEY secret)
- **Replit Auth** — OpenID Connect authentication provider

### CDN Resources
- Tailwind CSS via `cdn.tailwindcss.com`
- Inter font from Google Fonts
