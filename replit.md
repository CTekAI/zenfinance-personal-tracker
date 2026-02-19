# ZenFinance - Personal Finance Tracker

## Overview

ZenFinance is a client-side personal finance tracking application built with React and TypeScript. It provides a dashboard-driven interface for managing income, expenses, savings, debt, and wishlists. The app includes an AI financial advisor powered by Google's Gemini API that provides personalized financial guidance based on the user's data.

All financial data is persisted in the browser's localStorage — there is no backend server or database. The app is built with Vite and uses Tailwind CSS (loaded via CDN) for styling.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 19 with TypeScript, bundled by Vite
- **Styling**: Tailwind CSS loaded via CDN (`cdn.tailwindcss.com`), plus a custom `index.css` file. Font is Inter from Google Fonts.
- **Routing**: No router library — tab-based navigation managed via React state (`activeTab`). Tabs include Dashboard, Income, Expenses, Savings, Debt, Wishlist, and AI Advisor.
- **State Management**: All finance data lives in a single `FinanceData` state object in `App.tsx`, passed down as props to child components. No external state management library.
- **Data Persistence**: localStorage under the key `zenfinance_data`. Data is loaded on mount and saved on every change via a `useEffect`.
- **Charts**: Recharts library for data visualization (pie charts on the Dashboard).
- **Icons**: Lucide React icon library.

### File Structure
- `App.tsx` — Root component with sidebar navigation and tab switching
- `index.tsx` — React DOM entry point
- `types.ts` — TypeScript interfaces for all data models (IncomeItem, OutgoingItem, DebtItem, SavingsItem, WishlistItem, FinanceData)
- `constants.ts` — Category lists and seed/initial data
- `components/` — One component per tab:
  - `Dashboard.tsx` — Overview with summary cards and spending pie chart
  - `IncomeTracker.tsx` — CRUD for income sources
  - `OutgoingsTracker.tsx` — CRUD for expenses
  - `SavingsTracker.tsx` — Savings accounts with deposit functionality and progress toward targets
  - `DebtTracker.tsx` — Debt tracking with payments, interest rates, and drag-to-reorder
  - `WishlistTracker.tsx` — Wishlist items with saving progress and drag-to-reorder
  - `AIAdvisor.tsx` — Chat interface with Gemini AI

### Data Model
The `FinanceData` type contains five arrays:
- `income: IncomeItem[]` — source, amount, category, frequency
- `outgoings: OutgoingItem[]` — description, amount, category, date, frequency
- `savings: SavingsItem[]` — name, balance, optional target, category
- `debt: DebtItem[]` — name, balance, interest rate, min payment, priority, optional deadline
- `wishlist: WishlistItem[]` — item name, cost, saved amount, priority, optional deadline

Frequency types: Monthly, Weekly, Bi-Weekly, Yearly, One-time.

### Build & Dev Setup
- **Vite** dev server runs on port 5000, host `0.0.0.0`
- Path alias `@/*` maps to project root
- Environment variables: `GEMINI_API_KEY` is loaded from `.env.local` and exposed to client code via Vite's `define` config as both `process.env.API_KEY` and `process.env.GEMINI_API_KEY`
- The `index.html` also has an importmap for ESM imports (used for the non-bundled CDN version), but the Vite build uses npm packages directly

### Key Design Decisions
1. **No backend/database**: All data is client-side in localStorage. This keeps the app simple but means no cross-device sync. If adding a backend later, the `FinanceData` interface defines the complete schema.
2. **Single state object**: Rather than separate state for each financial category, everything is in one `FinanceData` object. This makes it easy to serialize/deserialize and pass to the AI advisor as context.
3. **AI runs client-side**: The Gemini API is called directly from the browser using `@google/genai`. The API key is embedded at build time. This means the key is exposed in the client bundle — a backend proxy would be more secure for production.
4. **Tailwind via CDN**: Not using PostCSS/Tailwind build pipeline. This simplifies setup but means no custom Tailwind config or purging.

## External Dependencies

### NPM Packages
- `react` / `react-dom` (v19) — UI framework
- `recharts` (v3.7) — Charting library for dashboard visualizations
- `lucide-react` (v0.563) — Icon library
- `@google/genai` (v1.39) — Google Generative AI SDK for Gemini integration
- `vite` (v6.2) + `@vitejs/plugin-react` — Build tooling
- `typescript` (v5.8) — Type checking

### External APIs
- **Google Gemini API** (`gemini-3-flash-preview` model) — Powers the AI financial advisor chat. Requires `GEMINI_API_KEY` environment variable set in `.env.local`. The full user financial data is sent as context with each message.

### CDN Resources
- Tailwind CSS via `cdn.tailwindcss.com`
- Inter font from Google Fonts

### No Database
There is no database. All persistence is via browser localStorage. If a database is needed in the future, the `FinanceData` interface in `types.ts` serves as the schema definition.