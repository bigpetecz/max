# Post–Nx bootstrap TODO

Checklist of recommendations to apply **after** generating the Nx monorepo (`apps/web`, `apps/api`, `apps/worker`, libs). Phase 0 feature work lives in [IMPLEMENTATION.md](./IMPLEMENTATION.md); this file is **tooling, docs, and hygiene** so nothing gets forgotten.

---

## A. Immediately after Nx scaffold

### Monorepo & apps

- [x] Generate apps per [architecture.md](./specs/architecture.md): `web` (React + Vite), `api` (NestJS + SWC), `worker`
- [x] Generate libs: `spec-kit`, `shared`, `integrations/sbazar`
- [x] Wire Nx project graph and `nx run-many` scripts for dev (`api`, `web`, `worker`, `redis`)
- [x] Copy [.env.example](../.env.example) → `.env` / per-app env; fill Google OAuth placeholders
- [x] Add `docker-compose.yml` for local Postgres + Redis (optional but recommended)

### Decisions to lock (update docs when chosen)

- [x] **Database:** PostgreSQL + Prisma — ADR-0003
- [x] **Package manager:** pnpm
- [ ] **Q5 Images:** Local worker paths vs S3 — document in IMPLEMENTATION when chosen
- [ ] **Q1 API prefix** (default `/api`) — README + Nest `setGlobalPrefix`
- [ ] **Q2 OAuth callback** on API — match Google Console redirect URI
- [ ] **Q3 SSE vs WebSocket** — implement one in S2
- [x] `prisma init` in `apps/api`; first migration for architecture §6 tables

### Agent & editor setup (mostly done — verify)

- [x] [AGENTS.md](../AGENTS.md) at repo root
- [x] [.cursor/rules/max.mdc](../.cursor/rules/max.mdc) (always apply)
- [x] Path rules: `api.mdc`, `worker.mdc`, `spec-kit.mdc`, `web.mdc` (activate once paths exist)
- [x] [.cursorignore](../.cursorignore)
- [ ] Confirm Cursor loads rules when opening `apps/api`, `apps/worker`, etc.

### Database

- [x] Postgres migrations: `users`, `sessions`, `tasks`, `task_runs`, `chat_messages`, `integrations`, `integration_credentials`, `credential_grants`
- [ ] Seed row for `integrations.sbazar`

---

## B. Right after `apps/api` exists

### Swagger / OpenAPI ([api-documentation.md](./specs/api-documentation.md))

- [ ] Install `@nestjs/swagger` (+ `swagger-ui-express` if needed)
- [ ] Enable Swagger UI (e.g. `http://localhost:3000/api/docs`)
- [ ] Decorate all **public** controllers/DTOs with `@ApiTags`, `@ApiOperation`, `@ApiCookieAuth` (session)
- [ ] Exclude or tag **internal** routes (`/internal/*`) — HMAC stays in [api-outline.md](./specs/api-outline.md) + [credential-vault.md](./specs/credential-vault.md)
- [ ] Add script `pnpm run export:openapi` → commit or CI-publish `apps/api/openapi.json`
- [ ] Update [api-outline.md](./specs/api-outline.md) header: canonical spec = OpenAPI; trim duplicated tables

### API implementation (Phase 0)

- [ ] Google SSO routes per [authentication.md](./specs/authentication.md)
- [ ] Session middleware / guard on protected routes
- [ ] Internal `POST /internal/credential-grants` + HMAC verification
- [ ] Internal `POST /internal/storage-state` (worker session upload)
- [ ] Envelope encryption service (`CREDENTIAL_KEK` only in API)
- [ ] BullMQ producer in `queue` module

---

## C. Right after `libs/spec-kit` + worker exist

- [ ] Implement Zod schemas from [specs/tasks/](./specs/tasks/) (`sbazar.createListing`, `sbazar.establishSession`)
- [ ] Task type whitelist registry for AI output validation
- [ ] Worker BullMQ consumer + HMAC grant client
- [ ] Playwright Sbazar workflow per task spec
- [ ] **Golden fixtures:** `libs/spec-kit/fixtures/chat-to-task/*.json` (input → expected `taskType` + payload) for tests
- [ ] Never import LLM into worker; never import Playwright into API

---

## D. Architecture enforcement & CI

- [ ] `@nx/enforce-module-boundaries` rules matching [architecture.md](./specs/architecture.md) import table
- [ ] ESLint boundary / dependency checks for `api` ↔ `worker` ↔ `integrations`
- [ ] CI pipeline: `nx affected -t lint,test,build` on PR
- [ ] CI: export OpenAPI and fail if `openapi.json` drift vs committed copy (optional)
- [ ] Contract tests against OpenAPI or Schemathesis (optional, later)
- [x] Integration smoke tests: `api:integration`, `worker:integration`, and root `test:integration`

---

## E. Documentation & process hygiene

- [ ] Tick [IMPLEMENTATION.md](./IMPLEMENTATION.md) Phase 0 checkboxes as items ship (source of truth for “done”)
- [ ] Reference **FR IDs** from [requirements.md](./specs/requirements.md) in PR titles/commits (e.g. `feat(api): Google callback FR-000`)
- [ ] Add `.github/pull_request_template.md` with:
  - [ ] Spec impact: IMPLEMENTATION / requirements FR-___
  - [ ] Security: no secrets in queue/logs/AI prompts
- [ ] Add `CONTRIBUTING.md` or section in README: agent prompt template —
  > Read `AGENTS.md` → complete IMPLEMENTATION § S1 item X only. Do not implement Rohlik/voice/mobile.
- [ ] Optional: Cursor **user rule** — “Prefer `docs/IMPLEMENTATION.md` over inventing architecture”

---

## F. Phase 1+ (do not block MVP)

- [ ] Credential vault UI (password + connection status)
- [ ] KEK rotation plan / cloud KMS (ADR)
- [ ] **Q4 Hosting** topology documented
- [ ] Ollama prompt eval script + fixture pass rate (Phase 3 AI enhancement)
- [ ] E2E: Playwright against staging Sbazar (flaky safeguards)
- [ ] Legal / ToS review for marketplace automation

---

## G. Already completed (pre-bootstrap)

- [x] PRD, architecture, requirements, auth, credential vault specs
- [x] Doc consolidation + [IMPLEMENTATION.md](./IMPLEMENTATION.md)
- [x] [api-outline.md](./specs/api-outline.md), [api-documentation.md](./specs/api-documentation.md)
- [x] Task contracts under [specs/tasks/](./specs/tasks/)
- [x] ADR-0001 Google SSO, ADR-0002 credential vault
- [x] `.env.example`, `AGENTS.md`, Cursor rules, `.cursorignore`

---

## Quick links

| Topic | Doc |
| ----- | --- |
| Phase 0 features | [IMPLEMENTATION.md](./IMPLEMENTATION.md) |
| Sprints | [agile-project-plan.md](./specs/agile-project-plan.md) |
| API routes (plan) | [api-outline.md](./specs/api-outline.md) |
| Swagger strategy | [api-documentation.md](./specs/api-documentation.md) |
