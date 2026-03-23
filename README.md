# م7فظتي — Personal Finance Tracker

A full-featured Arabic-first personal finance management PWA built with React, Supabase, and Tailwind CSS.

## Features

- **Wallets**: Multi-currency (EGP, USD, SAR, EUR, GBP) wallet management with fees
- **Transactions**: Income, expense, and transfer tracking with recurring support
- **Budgets**: Category-based budget limits with progress alerts
- **Reports**: 6 chart types, financial metrics, expense forecasting
- **Wishlist**: Priority-based savings goals
- **Notifications**: Budget warnings, large transaction alerts, recurring reminders
- **PWA**: Offline support, installable, pull-to-refresh
- **Dark Mode**: Full light/dark theme with 6 color schemes

## Prerequisites


- Node.js 18+
- A [Supabase](https://supabase.com) project

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the project root:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```
4. Run the SQL from `SUPABASE_SETUP.sql` in your Supabase SQL Editor to create all tables, RLS policies, and triggers.
5. Start the dev server:
   ```bash
   npm run dev
   ```
   The app runs at `http://localhost:8000`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 8000) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Check code quality |
| `npm run lint:fix` | Auto-fix lint issues |

## Testing

See [SETUP_AND_TESTING_GUIDE.md](SETUP_AND_TESTING_GUIDE.md) for detailed test scenarios covering signup, login, wallets, transactions, budgets, reports, settings, and multi-device sync.

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui (Radix)
- **Backend**: Supabase (Auth + PostgreSQL + Row Level Security)
- **Charts**: Recharts
- **Animations**: Framer Motion
- **State**: React Context + TanStack React Query
