# Agent instructions (Max)

You are working on **Max** — a personal automation platform (Nx monorepo). Follow this file before writing code.

## Required reading (in order)

1. [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md) — entry point, checklist, non-negotiables
2. [docs/specs/product-requirements.md](docs/specs/product-requirements.md) — MVP product behavior
3. [docs/specs/architecture.md](docs/specs/architecture.md) — components, Nx layout, data model
4. [docs/specs/authentication.md](docs/specs/authentication.md) — Google SSO
5. [docs/specs/credential-vault.md](docs/specs/credential-vault.md) — secrets and worker grants
6. [docs/specs/requirements.md](docs/specs/requirements.md) — FR/NFR acceptance criteria

Skim only: [docs/specs/tech-stack.md](docs/specs/tech-stack.md), [docs/specs/agile-project-plan.md](docs/specs/agile-project-plan.md).

**Do not** read removed/legacy doc names listed in IMPLEMENTATION.md. **Do not** read ADRs unless changing an architectural decision.

## Non-negotiable (never violate)

- AI module: structured JSON only — **no** Playwright, **no** credentials, **no** DOM.
- Worker: deterministic workflows — **no** LLM, **no** Postgres, **no** `CREDENTIAL_KEK`.
- BullMQ jobs: `taskId`, `userId`, `taskType`, `payload` — **no secrets**.
- Platform auth: Google SSO (API session). Sbazar auth: credential vault + grant API.
- Listing publish: user **approval** after schema validation.

## Before you implement

- API routes: [docs/specs/api-outline.md](docs/specs/api-outline.md) until `apps/api/openapi.json` exists; then prefer OpenAPI. Strategy: [docs/specs/api-documentation.md](docs/specs/api-documentation.md).
- After Nx scaffold: human checklist [docs/POST-BOOTSTRAP-TODO.md](docs/POST-BOOTSTRAP-TODO.md) (Swagger, CI, fixtures — not all required for first PR).
- Check [docs/specs/tasks/](docs/specs/tasks/) for task schemas (`taskType` + Zod fields).
- Copy env vars from [.env.example](.env.example); never commit real secrets.
- If a spec is silent on Q4–Q6 in IMPLEMENTATION.md, **ask** or document the choice in an ADR — do not guess security behavior.

## Repo layout (target)

```
apps/web          React
apps/api          NestJS control plane
apps/worker       BullMQ + Playwright
libs/spec-kit     Zod task schemas
libs/shared       shared types
libs/integrations/sbazar
```

## When finishing a task

- Reference FR IDs from requirements.md if adding features.
- Do not add parallel doc sets — update canonical specs or IMPLEMENTATION checklist only.
