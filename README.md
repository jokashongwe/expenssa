# Expenssa

Application web de gestion de budget (Next.js 15 + Supabase Postgres), multi-utilisateur, multi-devises (USD par défaut), avec budgets, plans d’épargne et support PWA.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui
- **Supabase Postgres** via Drizzle ORM (`postgres.js`)
- Auth.js (credentials email / mot de passe)
- Police **Roboto**
- PWA (`@ducanh2912/next-pwa`)
- Déploiement prévu : **Netlify**

## Configuration

1. Créez un projet [Supabase](https://supabase.com).
2. Copiez `.env.example` → `.env` et renseignez :
   - `DATABASE_URL` (URI Postgres, idéalement pooler port `6543` pour Netlify)
   - `AUTH_SECRET`
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (optionnel)
3. Appliquez le schéma :

```bash
npm run db:push
```

Ou exécutez [`supabase/schema.sql`](supabase/schema.sql) dans le SQL Editor Supabase.

## Démarrage

```bash
npm install
npm run db:push
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Déploiement Netlify

1. Connectez le dépôt à Netlify (plugin `@netlify/plugin-nextjs` déjà dans `netlify.toml`).
2. Ajoutez les variables d’environnement : `DATABASE_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST=true`.
3. Pour `DATABASE_URL` sur Netlify, utilisez la connection string **Transaction pooler** Supabase (port 6543).
4. Deploy.

## Scripts

- `npm run dev` — développement
- `npm run build` / `npm start` — production
- `npm run db:push` — synchroniser le schéma vers Supabase
- `npm run db:studio` — explorer la base
