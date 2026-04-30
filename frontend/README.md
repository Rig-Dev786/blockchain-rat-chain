# Frontend — Next.js + Tailwind + wagmi

## Setup
```bash
npm install
cp .env.example .env.local
npm run dev
```

## Structure
- `src/app/` — Next.js App Router pages
- `src/components/` — Reusable UI components
- `src/hooks/` — Custom React hooks (useWallet, useEscrow, etc.)
- `src/lib/wagmi/` — wagmi config, chain setup
- `src/context/` — Global context providers
