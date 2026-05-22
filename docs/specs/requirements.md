# Requirements

Traceable to [product-requirements.md](./product-requirements.md) and [architecture.md](./architecture.md). Entry: [../IMPLEMENTATION.md](../IMPLEMENTATION.md).

Status: `Proposed` | `Accepted` | `Deferred` | `Rejected`.

## Functional requirements — product features

### Platform authentication

| ID | Priority | Requirement | Acceptance criteria | Status |
| -- | -------- | ----------- | --------------------- | ------ |
| FR-000 | Must | Sign in with Google | OAuth PKCE; API session cookie; `GET /auth/me` returns user | Accepted |
| FR-000a | Must | Protected API routes | Unauthenticated requests to `/tasks`, `/chat`, `/credentials` return 401 | Accepted |

See [authentication.md](./authentication.md), ADR-0001.

### Chat interface (PRD §7.1)

| ID | Priority | Requirement | Acceptance criteria | Status |
| -- | -------- | ----------- | --------------------- | ------ |
| FR-001 | Must | Text chat input | User can send natural language messages | Accepted |
| FR-002 | Must | Task history | Past tasks and outcomes visible in UI | Accepted |
| FR-003 | Must | Approval before execution | User confirms plan (title, price, description); task queued only after approve; worker run includes publish | Accepted |

### Task generation (PRD §7.2)

| ID | Priority | Requirement | Acceptance criteria | Status |
| -- | -------- | ----------- | --------------------- | ------ |
| FR-004 | Must | LLM converts intent to structured JSON | Valid `taskType` and `payload` for supported intents | Accepted |
| FR-005 | Must | Schema validation | Invalid tasks rejected at API; no queue job | Accepted |
| FR-006 | Must | No AI browser control | AI module has no Playwright or site login | Accepted |

### Workflow execution (PRD §7.3)

| ID | Priority | Requirement | Acceptance criteria | Status |
| -- | -------- | ----------- | --------------------- | ------ |
| FR-007 | Must | Deterministic Playwright execution | Same task payload → same workflow steps | Accepted |
| FR-008 | Must | Sbazar integration only (MVP) | Only `sbazar.*` task types enqueue in MVP | Accepted |
| FR-009 | Must | Sbazar publish workflow | After approval: login, create, images, publish | Accepted |

### Credential management (PRD §7.4)

| ID | Priority | Requirement | Acceptance criteria | Status |
| -- | -------- | ----------- | --------------------- | ------ |
| FR-010 | Must | Encrypted credential storage | Envelope encryption in Postgres; KEK API-only — ADR-0002 | Accepted |
| FR-011 | Must | Worker credential handoff | Job-scoped HMAC grant; no secrets in BullMQ payload | Accepted |
| FR-011a | Must | Session reuse | Encrypted `storage_state` or password via grant; per-user profile | Accepted |
| FR-011b | Should | Guided Sbazar login (Phase 0) | User can establish session without storing password in UI | Proposed |

### Platform (architecture)

| ID | Priority | Requirement | Acceptance criteria | Status |
| -- | -------- | ----------- | --------------------- | ------ |
| FR-012 | Must | Queue decoupling | Approved tasks enqueue via BullMQ | Proposed |
| FR-013 | Must | Progress to UI | REST polling `GET /api/tasks/:id` while running | Accepted |
| FR-014 | Should | OpenAI fallback planner | Configurable when Ollama unavailable | Proposed |
| FR-015 | Could | Rohlik shopping | Phase 2 — search, cart, draft checkout | Deferred |

## Non-functional requirements

| ID | Category | Requirement | Target / measure | Status |
| -- | -------- | ----------- | ---------------- | ------ |
| NFR-001 | Safety | Manual approval before publish | Worker not started until user approves reviewed fields | Accepted |
| NFR-002 | Security | AI cannot access credentials | Secrets only to worker via ephemeral decrypt | Accepted |
| NFR-003 | Security | Mitigate prompt injection | Structured output only; schema whitelist | Proposed |
| NFR-004 | Reliability | Job retries | BullMQ retry on transient failures | Proposed |
| NFR-005 | Testability | Deterministic workflows | Sbazar steps testable without LLM | Proposed |
| NFR-006 | Observability | Run artifacts | Logs/screenshots; credentials redacted | Proposed |

## Core user flow (MVP)

Canonical flow from PRD §6:

1. User: *"Sell my binoculars for 12,000 CZK on Sbazar"*
2. System: structured task + schema validation
3. User reviews: **title**, **price**, **description**
4. User **approves**
5. Worker: login → create listing → upload images → publish
6. UI: result and history updated

### Flow — rejection or edit before approval

1. User reviews proposed task.
2. User rejects or edits fields (_edit UX TBD_).
3. System re-validates; returns to approval when valid.

### Flow — execution failure

1. Worker fails; BullMQ retries per policy.
2. UI shows sanitized error; user may fix payload and re-approve (_TBD_).

## Data requirements

| Entity | Notes |
| ------ | ----- |
| User | Single-user MVP; multi-user in future PRD |
| Chat message | Conversation + linked tasks |
| Task | `taskType`, `payload`, approval status, run status |
| Credential | Per integration; encrypted |
| Run log | Progress, screenshots; no secrets |

## Integrations (MVP)

| Site | MVP | Capabilities |
| ---- | --- | ------------ |
| Sbazar | Yes | Create listing, images, publish |
| Rohlik | No | Phase 2 — shopping automation |

## Compliance and policy

Third-party automation may violate site terms. User consent and legal review before production — _TBD_.

## References

- [product-requirements.md](./product-requirements.md) — feature list and MVP flow
- [architecture.md](./architecture.md) — component boundaries
