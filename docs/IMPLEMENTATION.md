# Implementation guide (read this first)

Single entry point for **humans and coding agents** implementing Max. Do not read every file under `docs/specs/` — use the map below.

**Not started coding yet?** Complete [PRE-PHASE-0.md](./PRE-PHASE-0.md) first (toolchain, Google OAuth, decisions, Nx bootstrap).

## Document map (canonical set)

| # | File | Read when | Agent priority |
| - | ---- | --------- | -------------- |
| 1 | [specs/product-requirements.md](./specs/product-requirements.md) | What to build (MVP flow, features) | **Required** |
| 2 | [specs/architecture.md](./specs/architecture.md) | Components, Nx layout, data model, env vars | **Required** |
| 3 | [specs/requirements.md](./specs/requirements.md) | FR/NFR IDs for acceptance tests | **Required** |
| 4 | [specs/authentication.md](./specs/authentication.md) | Google SSO (Phase 0) | **Required** |
| 5 | [specs/credential-vault.md](./specs/credential-vault.md) | Site secrets + worker grant (Phase 0) | **Required** |
| 6 | [specs/tech-stack.md](./specs/tech-stack.md) | Quick reference tables | Skim |
| 7 | [specs/agile-project-plan.md](./specs/agile-project-plan.md) | Sprint order, Definition of Done | Skim |
| — | [specs/api-outline.md](./specs/api-outline.md) | REST routes (planning); then OpenAPI | **When coding API/worker** |
| — | [specs/api-documentation.md](./specs/api-documentation.md) | Swagger vs markdown strategy | **When scaffolding API** |
| — | [specs/tasks/](./specs/tasks/) | Per-`taskType` Zod + workflows | **When coding spec-kit / worker** |

**Optional (humans / rationale only):** [specs/decisions/](./specs/decisions/) — ADRs 0001–0002 restate what is already summarized in architecture + auth + vault docs.

## Repository files for agents

| File | Purpose |
| ---- | ------- |
| [../AGENTS.md](../AGENTS.md) | Root pointer (Cursor, Claude, etc.) |
| [../.cursor/rules/max.mdc](../.cursor/rules/max.mdc) | Always-on Cursor rule |
| [../.env.example](../.env.example) | Environment variable template |
| [../.cursor/rules/](../.cursor/rules/) | Path-scoped rules (`api`, `worker`, `spec-kit`, `web`) |

**API docs:** Plan with `api-outline.md`; implement with **NestJS Swagger** → export `apps/api/openapi.json` (see api-documentation.md).

**After Nx bootstrap:** work through [POST-BOOTSTRAP-TODO.md](./POST-BOOTSTRAP-TODO.md) (tooling, Swagger, CI, agent hygiene).

## Non-negotiable rules

1. **AI never** controls the browser, holds credentials, or appears in the worker.
2. **BullMQ jobs** contain `taskId`, `userId`, `taskType`, `payload` only — **no secrets**.
3. **Worker** has no Postgres, no `CREDENTIAL_KEK`; uses HMAC **credential grant** API.
4. **Platform login** = Google SSO (API session cookie). **Sbazar login** = integration vault (separate).
5. **Publish tasks** require user **approval** after schema validation (title, price, description).

## Phase 0 — implementation checklist

### S1 (week 1)

- [x] Nx: `apps/web` (React + Vite), `apps/api` (NestJS + SWC), `apps/worker`, `libs/spec-kit`, `libs/shared`, `libs/integrations/sbazar`
- [x] Postgres + migrations: `users`, `sessions`, `tasks`, `integrations`, `integration_credentials`
- [ ] Google SSO: routes in § authentication.md
- [ ] Spec Kit: `sbazar.createListing` Zod schema
- [ ] React: login, chat shell, empty task list

### S2 (week 2)

- [ ] AI module: Ollama → JSON → validate → `PendingApproval`
- [ ] Approval UI → enqueue BullMQ
- [ ] Internal `POST /internal/credential-grants` (HMAC)
- [ ] Worker: consume job → grant → Playwright Sbazar listing E2E
- [ ] SSE or WebSocket task status

### Phase 0 shortcuts (allowed)

- **Guided Sbazar login** → save encrypted `storage_state` (see credential-vault.md §7B) instead of full password settings UI.
- ORM choice (Prisma vs TypeORM): pick one at scaffold — not spec-blocking.

## Task shape (example)

```json
{
  "taskType": "sbazar.createListing",
  "payload": {
    "title": "Nikon Monarch 10x42",
    "price": 12000,
    "description": "..."
  }
}
```

## Resolved decisions

| ID | Decision |
| -- | -------- |
| DB | **PostgreSQL** + **Prisma** — [ADR-0003](./specs/decisions/0003-database-postgresql-prisma.md) |
| Platform auth | Google SSO — ADR-0001 |
| Site secrets | Vault + worker grant — ADR-0002 |
| API prefix | `/api` — ADR-0004 |
| OAuth | Code + PKCE, API callback, httpOnly session — ADR-0004 |
| UI updates | **REST polling** (no SSE/WebSocket MVP) — ADR-0004 |
| Images | Local paths on worker — ADR-0004 |
| Approval | Confirm plan **before queue**; then worker executes (incl. publish) — ADR-0004 |
| Env | Root `.env` — ADR-0004 |
| Package manager | pnpm |
| Web scaffold | React + Vite |
| API scaffold | NestJS + SWC |
| Ollama | `qwen2.5:7b-instruct` (see below) — ADR-0004 |

## Ollama models (Czech chat → JSON tasks)

Use **Ollama structured output** (`format` = Zod/JSON schema) + **temperature 0**. Czech user messages are fine if the model is multilingual and the schema is enforced in code.

| Tier | Model | Pull | When |
| ---- | ----- | ---- | ---- |
| **Default (recommended)** | `qwen2.5:7b-instruct` | `ollama pull qwen2.5:7b-instruct` | 8–16 GB RAM; strong multilingual + JSON |
| **European languages** | `mistral:7b-instruct` | `ollama pull mistral:7b-instruct` | Alternative if Qwen weak on your Czech samples |
| **Low RAM** | `llama3.2:3b-instruct` | `ollama pull llama3.2:3b-instruct` | Faster, less accurate — test before committing |
| **Heavier (optional)** | `qwen2.5:14b-instruct` | if you have 16GB+ VRAM | Better reasoning, slower |

Set in root `.env`: `OLLAMA_MODEL=qwen2.5:7b-instruct`

Phase 0: tune prompts + fixtures in `libs/spec-kit/fixtures/chat-to-task/` with real Czech phrases (*"Prodej binokulářů na Sbazar za 12000 Kč"*).

## Open questions (defer)

| ID | Topic |
| -- | ----- |
| Q4 | Production hosting |
| Q9 | OpenAI fallback (off unless needed in S2) |

## Removed docs (do not search for these)

Consolidated to reduce duplication for agents:

- ~~`01-overview.md`~~ → PRD
- ~~`02-scope.md`~~ → agile plan + PRD
- ~~`03-requirements.md`~~ → `requirements.md`
- ~~`04-architecture.md`~~ → `architecture.md`
- ~~`05-tech-stack.md`~~ → `tech-stack.md`
- ~~`06-constraints.md`~~ → risks in IMPLEMENTATION + architecture §10
- ~~`system-architecture.md`~~ / ~~`architecture-detailed.md`~~ → `architecture.md`
