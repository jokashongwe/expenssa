# Expenssa

Application web de gestion de budget (Next.js 15 + SQLite), multi-utilisateur, multi-devises (USD par défaut), avec budgets, plans d’épargne et support PWA.

## Démarrage

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

Créer un compte : USD et des catégories de base sont ajoutés automatiquement. Ajoutez le CDF (ou d’autres devises) dans **Devises**.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui
- SQLite (`data/expenssa.db`) via better-sqlite3 + Drizzle ORM
- Auth.js (credentials email / mot de passe)
- PWA (`@ducanh2912/next-pwa`)

## Scripts

- `npm run dev` — développement
- `npm run build` / `npm start` — production
- `npm run db:studio` — explorer la base
