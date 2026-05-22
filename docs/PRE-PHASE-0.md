# Pre–Phase 0 checklist

Everything to prepare **before** Sprint 1 feature work. Phase 0 coding checklist: [IMPLEMENTATION.md](./IMPLEMENTATION.md). After `nx g` apps: [POST-BOOTSTRAP-TODO.md](./POST-BOOTSTRAP-TODO.md).

---

## Already done (no action)

- [x] Product + architecture specs, ADRs (Google SSO, credential vault)
- [x] Agent docs: `AGENTS.md`, `IMPLEMENTATION.md`, Cursor rules, `.env.example`
- [x] API outline, task contracts (`sbazar.createListing`), post-bootstrap TODO list
- [x] Empty Nx workspace (`nx` 22.7.2) — **no apps/libs yet**

---

## 1. Local toolchain (install once)

| Tool | Version / notes | Used for |
| ---- | ----------------- | -------- |
| Node.js | LTS 20+ or 22+ | Nx, Nest, React |
| pnpm | Use Corepack (`corepack enable`) | Monorepo |
| Docker Desktop | Optional but recommended | Postgres + Redis locally |
| PostgreSQL | 15+ (or Docker only) | Users, tasks, vault |
| Redis | 7+ (or Docker only) | BullMQ |
| Ollama | Latest + pull a model | Local planner (`llama3`, `mistral`, etc.) |
| Playwright browsers | After worker app exists | `npx playwright install chromium` |
| Git | — | Repo already initialized |

Verify:

```bash
node -v && pnpm -v && docker -v && redis-cli ping  # or start docker-compose first
ollama list   # optional until S2
```

---

## 2. External accounts & secrets (before Google SSO works)

### Google Cloud (platform login)

- [ ] Create project in [Google Cloud Console](https://console.cloud.google.com/)
- [ ] OAuth consent screen (External or Internal)
- [ ] OAuth client **Web application**
- [ ] Authorized JavaScript origins: `http://localhost:4200` (web dev)
- [ ] Authorized redirect URI: match [authentication.md](./specs/authentication.md) (API callback recommended, e.g. `http://localhost:3000/api/auth/google/callback`)
- [ ] Copy `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` into `.env` (from `.env.example`)

### Local secrets (generate — do not commit)

```bash
openssl rand -base64 32   # SESSION_SECRET
openssl rand -base64 32   # CREDENTIAL_KEK
openssl rand -base64 32   # WORKER_SERVICE_HMAC_SECRET
```

- [ ] Fill `.env` at repo root or per-app (document which in README when scaffolded)

### Sbazar (integration — Phase 0 testing)

- [ ] Test account on Sbazar (or plan guided-login flow only)
- [ ] Accept that automating the site may violate ToS — note in [requirements.md](./specs/requirements.md); legal review in post-bootstrap § F

### Optional for S2

- [ ] OpenAI API key if using fallback planner

---

## 3. Decisions

### Locked

- [x] **PostgreSQL + Prisma** — [ADR-0003](./specs/decisions/0003-database-postgresql-prisma.md)
- [x] Google SSO (ADR-0001), credential vault + grant (ADR-0002)

### Locked (ADR-0004)

- [x] API prefix `/api`
- [x] OAuth: Code + PKCE, API callback, httpOnly session (industry standard — [authentication.md](./specs/authentication.md))
- [x] UI: REST polling only (no sockets MVP)
- [x] Images: local paths on worker
- [x] Approval: once before queue (plan confirmed → then execute/publish)
- [x] Root `.env`
- [x] Ollama: `qwen2.5:7b-instruct` — `ollama pull qwen2.5:7b-instruct`

Defer: Q4 hosting, Q9 OpenAI fallback, KMS, Rohlik.

---

## 4. Nx bootstrap (first implementation step)

This **is** the start of Phase 0 engineering — do before chat/AI/Sbazar E2E:

- [ ] `nx g` apps: `web` (React + Vite), `api` (NestJS + SWC), `worker` (Node)
- [ ] `nx g` libs: `spec-kit`, `shared`, `integrations-sbazar` (path `libs/integrations/sbazar`)
- [ ] `docker-compose.yml` for Postgres + Redis
- [ ] First migration / schema (tables in [architecture.md](./specs/architecture.md) §6)
- [ ] `nx run-many` dev script or documented terminals (api :3000, web :4200, worker, redis)

Then continue **[POST-BOOTSTRAP-TODO.md](./POST-BOOTSTRAP-TODO.md) § A → B → C** in order.

---

## 5. Recommended before S2 (can slip to early week 2)

- [ ] Swagger on API (POST-BOOTSTRAP § B) — best started in S1 alongside controllers
- [ ] `docker compose up -d` documented in README
- [ ] Minimal CI (lint on PR) — POST-BOOTSTRAP § D
- [ ] GitHub repo remote + branch protection (if team)

---

## 6. Explicitly not required before Phase 0

- Rohlik, voice, mobile
- Production hosting (Q4)
- Full credential settings UI (guided login OK in S2)
- Cloud KMS / KEK rotation
- OpenAPI CI drift check (nice later)
- Legal sign-off (awareness enough to start dev; review before public launch)

---

## Suggested order (one day plan)

| Order | Task | Time |
| ----- | ---- | ---- |
| 1 | Install toolchain + Docker | 30 min |
| 2 | Google OAuth + `.env` secrets | 30 min |
| 3 | Lock Q6, Q5, API prefix, SSE vs WS | 15 min |
| 4 | Nx generate apps/libs + docker-compose | 2–4 h |
| 5 | POST-BOOTSTRAP § A (migrations, dev scripts) | 2–4 h |
| 6 | IMPLEMENTATION § S1 (auth shell, spec-kit, chat UI) | rest of week 1 |

---

## Quick reference

| Question | Doc |
| -------- | --- |
| What to build? | [IMPLEMENTATION.md](./IMPLEMENTATION.md), [product-requirements.md](./specs/product-requirements.md) |
| After nx g? | [POST-BOOTSTRAP-TODO.md](./POST-BOOTSTRAP-TODO.md) |
| Google SSO setup? | [authentication.md](./specs/authentication.md) |
| Worker secrets? | [credential-vault.md](./specs/credential-vault.md) |
