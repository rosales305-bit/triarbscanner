# Triangular Arb Scanner

A TypeScript + React application for scanning triangular arbitrage opportunities.

## Tech Stack

- **React** 18.3.1
- **TypeScript** 5.5.3
- **Vite** 5.4.2
- **Tailwind CSS** 3.4.1
- **Supabase** 2.57.4
- **Lucide React** (Icons) 0.344.0

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account (for database/backend services)

## Getting Started

### 1. Clone and Install

```bash
git clone https://github.com/rosales305-bit/triarbscanner.git
cd triarbscanner
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory and add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project settings at https://supabase.com

### 3. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Check code with ESLint |
| `npm run typecheck` | Run TypeScript type checking |

## Project Structure

```
src/              # Source code
supabase/         # Supabase configuration
public/           # Static assets
index.html        # Entry point
```

## License

This project is open source.
