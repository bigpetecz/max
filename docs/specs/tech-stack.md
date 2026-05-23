# Tech stack

Aligned with [architecture.md](./architecture.md). ADRs: [0001](./decisions/0001-authentication-google-sso.md), [0002](./decisions/0002-credential-vault-and-worker-handoff.md).

## Workspace

| Area            | Choice     | Version / notes                     |
| --------------- | ---------- | ----------------------------------- |
| Monorepo        | Nx         | 22.7.2                              |
| Package manager | pnpm       | Lockfile in repo (`pnpm-lock.yaml`) |
| Language        | TypeScript | All apps and libs                   |

## Applications

| App      | Framework         | Hosting             | Status     |
| -------- | ----------------- | ------------------- | ---------- |
| `web`    | React + Vite      | _TBD_               | Scaffolded |
| `api`    | NestJS + SWC      | _TBD_               | Scaffolded |
| `worker` | Node + Playwright | Isolated containers | Scaffolded |

## Libraries

| Library               | Purpose                                    | Status     |
| --------------------- | ------------------------------------------ | ---------- |
| `spec-kit`            | Task schemas, capabilities, Zod validation | Scaffolded |
| `integrations/sbazar` | Sbazar Playwright workflows                | Scaffolded |
| `integrations/rohlik` | Rohlik workflows                           | Phase 2    |
| `shared`              | Types, utilities                           | Scaffolded |

## Backend / API

| Area       | Choice                      | Notes                                                                                               |
| ---------- | --------------------------- | --------------------------------------------------------------------------------------------------- |
| Framework  | NestJS + SWC                | Modules: auth, users, **credentials**, tasks, chat, ai, queue, integrations                         |
| API style  | REST                        | Polling for task updates in MVP (ADR-0004)                                                          |
| API docs   | `@nestjs/swagger` + OpenAPI | Dev UI `/api/docs`; export `apps/api/openapi.json` — [api-documentation.md](./api-documentation.md) |
| Validation | Zod + Spec Kit              | AI output and task payloads                                                                         |
| Database   | **PostgreSQL**              | Users, sessions, tasks, encrypted credentials — ADR-0003                                            |
| ORM        | **Prisma**                  | `apps/api/prisma/schema.prisma`; migrations in API app — ADR-0003                                   |
| Queue      | BullMQ + Redis              | Job payload **without** secrets                                                                     |

## Authentication & identity

| Area              | Choice                      | Notes                                                               |
| ----------------- | --------------------------- | ------------------------------------------------------------------- |
| Platform sign-in  | **Google SSO** (OIDC)       | [authentication.md](./authentication.md), ADR-0001                  |
| Session           | Access JWT + refresh cookie | Passport Google + JWT guard + refresh-token rotation in API         |
| Integration login | Credential vault            | Separate from Google — [credential-vault.md](./credential-vault.md) |

## Credentials & worker

| Area           | Choice                                | Notes                               |
| -------------- | ------------------------------------- | ----------------------------------- |
| Encryption     | AES-256-GCM envelope                  | KEK in API env only; ADR-0002       |
| Storage        | `integration_credentials` in Postgres | `password` or `storage_state` kinds |
| Worker handoff | HMAC internal grant API               | 60s single-use; no DB on worker     |
| Session reuse  | Encrypted Playwright `storageState`   | Phase 0 optional; Phase 1 primary   |

## AI

| Area        | Choice    | Notes                                   |
| ----------- | --------- | --------------------------------------- |
| MVP planner | Ollama    | Local                                   |
| Fallback    | OpenAI    | Optional                                |
| Output      | JSON only | Must pass Spec Kit / Zod before enqueue |

## Execution

| Area               | Choice                            | Notes                                      |
| ------------------ | --------------------------------- | ------------------------------------------ |
| Browser automation | Playwright                        | Per-user profiles; see credential-vault.md |
| Worker queue       | BullMQ                            | Retries, execution state                   |
| Worker secrets     | `WORKER_SERVICE_HMAC_SECRET` only | No `DATABASE_URL` or `CREDENTIAL_KEK`      |

## Frontend

| Area           | Choice                  | Notes                                       |
| -------------- | ----------------------- | ------------------------------------------- |
| Framework      | React + Vite            | Chat, approval, integrations settings       |
| Google sign-in | Redirect / API callback | `credentials: 'include'` for session cookie |
| Live updates   | WebSocket or SSE        | From API                                    |

## Security

| Area             | Choice                      | Notes                   |
| ---------------- | --------------------------- | ----------------------- |
| Platform auth    | Google OIDC + PKCE          | See authentication.md   |
| Site credentials | Envelope encryption + grant | See credential-vault.md |
| AI isolation     | No secrets in prompts       | Enforced in `ai` module |

## Tooling

| Tool              | Purpose                            | Status                                                             |
| ----------------- | ---------------------------------- | ------------------------------------------------------------------ |
| ESLint            | Linting                            | With Nx apps                                                       |
| Prettier          | Formatting                         | Configured                                                         |
| CI                | GitHub Actions + Nx                | PR affected lint/format; full lint/format on `main`                |
| Integration tests | `@nestjs/testing` + supertest + Nx | API auth + health integration via Jest; worker smoke test retained |
| E2E               | Playwright                         | Worker/browser flows planned; web e2e _TBD_                        |

## Third-party services

| Service      | Use case          | Environment         |
| ------------ | ----------------- | ------------------- |
| Google OAuth | Platform SSO      | API + Cloud Console |
| Redis        | BullMQ            | All non-local envs  |
| PostgreSQL   | Primary datastore | API                 |
| Ollama       | AI planning       | MVP local           |
| OpenAI       | AI fallback       | Optional            |
| Sbazar       | Target site       | MVP integration     |
| Rohlik       | Target site       | Phase 2             |

## Environment variables (summary)

| Variable                                    | App          | Secret? |
| ------------------------------------------- | ------------ | ------- |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | API          | Yes     |
| `SESSION_SECRET`                            | API          | Yes     |
| `CREDENTIAL_KEK`                            | API          | Yes     |
| `WORKER_SERVICE_HMAC_SECRET`                | API + worker | Yes     |
| `DATABASE_URL`                              | API          | Yes     |
| `REDIS_URL`                                 | API + worker | Yes     |

## Future (out of MVP stack)

| Area      | Choice          | Phase              |
| --------- | --------------- | ------------------ |
| Cloud KMS | KEK replacement | Post-MVP hardening |
| Voice     | Whisper         | 3                  |
| Mobile    | SwiftUI         | 4                  |
