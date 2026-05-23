# Agile Project Plan

Delivery timeline and sprint phases for **Max**. Product: [product-requirements.md](./product-requirements.md). Technical: [architecture.md](./architecture.md). **Agents:** [../IMPLEMENTATION.md](../IMPLEMENTATION.md).

## Methodology

**Lightweight Agile** — **1-week sprints**

| Focus                           | Description                                              |
| ------------------------------- | -------------------------------------------------------- |
| Working software early          | End-to-end Sbazar path before polish                     |
| Iterative expansion             | Rohlik, AI, voice, mobile in later phases                |
| Strong architectural foundation | AI / API / worker / integrations separation from day one |

---

## Phase map (agile ↔ product)

Agile plan phases include **week ranges**. Product PRD uses **Phase 0** for MVP outcomes; architecture doc uses **Phase 2+** for Rohlik/voice/mobile. Use this table to cross-reference:

| Agile phase                | Weeks  | Product / PRD          | Architecture doc                 |
| -------------------------- | ------ | ---------------------- | -------------------------------- |
| **0 — Foundation**         | 1–2    | MVP / Phase 0 goals    | Core platform + Sbazar           |
| **1 — Stabilization**      | 3–4    | MVP hardening          | Credentials, retries, validation |
| **2 — Second integration** | 5–6    | Rohlik (future §8)     | Rohlik + capability metadata     |
| **3 — AI enhancement**     | 7–8    | Planner improvements   | Ollama tuning, suggestions       |
| **4 — Voice**              | Future | Voice (non-goal MVP)   | Whisper pipeline                 |
| **5 — Mobile**             | Future | SwiftUI (non-goal MVP) | iOS client                       |

---

# Phase 0 — Foundation (Weeks 1–2)

## Goal

Build minimal working system for **Sbazar** automation.

## Deliverables

- [ ] Nx monorepo setup (`web`, `api`, `worker`, `spec-kit`, integrations)
- [ ] API service (NestJS control plane)
- [ ] Worker service (BullMQ consumer + Playwright)
- [ ] React chat UI
- [ ] Playwright Sbazar integration
- [ ] Sbazar create-listing workflow (manual + automated hybrid where needed)
- [ ] Basic task schema system (Spec Kit / Zod)

## Definition of Done

- [ ] User can submit request via chat
- [ ] Task is converted to structured JSON
- [ ] User can approve task
- [ ] Sbazar listing is created automatically

## Prerequisites (documentation — before S1)

- [x] PRD, system architecture, agile plan
- [x] [authentication.md](./authentication.md) — Google SSO
- [x] [credential-vault.md](./credential-vault.md) — vault + worker grant
- [x] ADR-0001, ADR-0002

## Sprint breakdown (suggested)

| Sprint      | Focus                                                                                         |
| ----------- | --------------------------------------------------------------------------------------------- |
| **S1 (W1)** | Nx scaffold; Google auth + sessions; Postgres; Spec Kit; chat UI shell; credential grant stub |
| **S2 (W2)** | AI → JSON; approval; worker + Playwright; grant E2E; Sbazar listing (session or password)     |

---

# Phase 1 — Stabilization (Weeks 3–4)

## Goal

Make the system **reliable** and **reusable**.

## Features

- [ ] Credential vault (encrypted storage)
- [ ] Playwright session persistence (browser profiles)
- [ ] Retry mechanism for workflows (BullMQ + integration policies)
- [ ] Improved task validation (Zod / schema layer hardening)

## Definition of Done

- [ ] Credentials encrypted; AI never receives secrets
- [ ] Repeat Sbazar runs reuse session when valid
- [ ] Transient failures retry without user re-entry
- [ ] Invalid AI output rejected with clear UI feedback

## Sprint breakdown (suggested)

| Sprint      | Focus                                                    |
| ----------- | -------------------------------------------------------- |
| **S3 (W3)** | Credential vault + worker injection; session persistence |
| **S4 (W4)** | Retries, observability, validation UX, regression tests  |

---

# Phase 2 — Second Integration (Weeks 5–6)

## Goal

Add a second real-world use case (**Rohlik**).

## Features

- [ ] Rohlik integration (search + cart + order draft)
- [ ] Shared workflow engine reuse across integrations
- [ ] Capability-based system (integration metadata in Spec Kit / API)

## Definition of Done

- [ ] At least one Rohlik task type validated and executable end-to-end
- [ ] New integration added without changing worker core
- [ ] Capabilities documented per integration

## Sprint breakdown (suggested)

| Sprint      | Focus                                            |
| ----------- | ------------------------------------------------ |
| **S5 (W5)** | Rohlik adapter + schemas; capability registry    |
| **S6 (W6)** | Rohlik E2E flows; multi-integration task routing |

---

# Phase 3 — AI Enhancement (Weeks 7–8)

## Goal

Improve the **intelligence layer** (planning only — not execution).

## Features

- [ ] Better intent parsing (Ollama tuning / prompts)
- [ ] Task suggestions in chat
- [ ] Price recommendation for listings
- [ ] Structured validation feedback loop (AI ↔ Spec Kit)

## Definition of Done

- [ ] Higher task JSON acceptance rate on first turn
- [ ] Suggestions and price hints are optional, schema-bound, and user-overridable
- [ ] Validation errors feed back into planner prompts safely

## Sprint breakdown (suggested)

| Sprint      | Focus                                          |
| ----------- | ---------------------------------------------- |
| **S7 (W7)** | Prompt tuning, evaluation set, suggestion UX   |
| **S8 (W8)** | Price recommendation; validation feedback loop |

---

# Phase 4 — Voice Interface (Future)

## Goal

Natural **voice** interaction.

## Features

- Whisper speech-to-text
- Optional text-to-speech
- Voice → same task pipeline (chat equivalent)

_Out of current 8-week delivery window._

---

# Phase 5 — Mobile App (Future)

## Goal

Extend platform to **iOS**.

## Features

- SwiftUI app
- Task approval mobile UI
- Push notifications
- Task tracking

_Out of current 8-week delivery window._

---

# Key engineering principles

Non-negotiable across all phases:

| Principle    | Rule                                                         |
| ------------ | ------------------------------------------------------------ |
| AI boundary  | AI **never** directly controls the browser                   |
| Execution    | **Deterministic** workflows only in worker/integrations      |
| Integrations | **Isolated modules** per website                             |
| Tasks        | **Schema-driven** — Spec Kit + Zod                           |
| Safety       | **Approval required** for destructive actions (e.g. publish) |

---

# Traceability

| Agile phase | Specs to update when done                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------ |
| 0           | [IMPLEMENTATION.md](../IMPLEMENTATION.md) checklist, [requirements.md](./requirements.md) status |
| 1           | [architecture.md](./architecture.md) §10 risks                                                   |
| 2+          | [product-requirements.md](./product-requirements.md) §8                                          |
