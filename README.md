# Memo app

The starting point for greenfield projects on the `mern` stack of Agentic Delivery Studio. An executor copies these files into a new, empty project repo as its first PR (the "Seed from boilerplate" unit), and every other unit is built on top.

Stack: MongoDB 7 · Express 5 · React 19 (Vite) · Node 24 · TypeScript · Mongoose · Tailwind CSS 4 · shadcn/ui · Vitest · ESLint.

It ships a working sign-up, sign-in (JWT) and a protected placeholder resource (notes), so the first real feature starts from a running app.

## Run it locally

Needs Node 24, pnpm 11 and Docker.

```bash
cp .env.example .env
pnpm install
pnpm db:up
pnpm dev
```

Open http://localhost:5173. The Vite dev server forwards `/api` to the Express server on http://localhost:4000. `GET /api/health` returns `{ status, database, checkedAt }` (503 while the database is down).

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | API (with reload) and web app together |
| `pnpm build` | Compiles the API to `server/dist` and builds the web app to `client/dist` |
| `pnpm start` | Runs the compiled API |
| `pnpm lint` | ESLint over both packages |
| `pnpm typecheck` | `tsc` in both packages |
| `pnpm test` | Vitest in both packages; the API tests need the database, so run `pnpm db:up` first |
| `pnpm db:up` / `pnpm db:down` | Local MongoDB from `compose.yml` |

The API tests use their own database (`app_test`, emptied before and after each file) so they never touch development data. Set `MONGODB_URI` to point them elsewhere.

CI (`.github/workflows/ci.yml`) runs install, typecheck, lint, test and build on every pull request, with a MongoDB service.

## API

| Route | Auth | What it does |
|---|---|---|
| `GET /api/health` | no | Database status |
| `POST /api/auth/register` | no | `{ name, email, password }` (password 8+ characters) → `{ token, user }` |
| `POST /api/auth/login` | no | `{ email, password }` → `{ token, user }` |
| `GET /api/auth/me` | yes | The signed-in user |
| `GET /api/notes`, `POST /api/notes`, `DELETE /api/notes/:id` | yes | The signed-in user's notes |

Send the token as `Authorization: Bearer <token>`. Input is validated with Zod; errors come back as `{ error }` with a 400, 401, 404 or 409 status.

## Layout

```
server/src/app.ts          the Express app (createApp), used by the server and by the tests
server/src/index.ts        connects to MongoDB and listens
server/src/env.ts          environment variables, validated with Zod
server/src/models/         Mongoose models (user, note)
server/src/routes/         health, auth, notes
server/src/middleware/     requireAuth, error handling
server/src/lib/            password hashing, tokens, health logic
server/tests/              unit and integration tests
client/src/pages/          pages
client/src/components/     app components; ui/ holds the shadcn/ui components
client/src/lib/            API client, auth context
```

Add shadcn/ui components with `pnpm --filter @app/client dlx shadcn@latest add <name>`.

Before deploying: set `JWT_SECRET` to a long random value, and set `CLIENT_ORIGIN` to the web app's address. The `Note` model is a placeholder; replace it with the first real model.
