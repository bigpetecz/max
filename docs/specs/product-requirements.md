# Product Requirements Document

Canonical product requirements for **Max** (repo name). Working product name: **Personal Automation Platform**.

Technical implementation: [architecture.md](./architecture.md). Agent entry: [../IMPLEMENTATION.md](../IMPLEMENTATION.md).

---

## 1. Product name

**Personal Automation Platform** (working name) — codebase and Nx workspace: **Max**.

---

## 2. Vision

A personal AI-powered system that allows users to delegate real-world web tasks (e.g., creating ads, shopping, bookings) via **chat** and later **voice**, using a controlled set of trusted integrations.

The system translates natural language into **structured tasks** and executes them **safely** on selected websites using browser automation.

---

## 3. Problem statement

Users repeatedly perform manual, repetitive web tasks such as:

- Creating classifieds (e.g. Sbazar)
- Shopping (e.g. Rohlik)
- Filling forms
- Searching and ordering products

These tasks are:

- Time-consuming
- Repetitive
- Error-prone
- Fragmented across websites

---

## 4. Goals (MVP / Phase 0)

| Goal | Description |
| ---- | ----------- |
| Sbazar listing via chat | End-to-end create listing from natural language |
| Structured AI tasks | Intent → JSON; **no** direct AI browser control |
| Playwright execution | Deterministic worker automation |
| Manual approval | User approves before publish/execute |
| Persistent sessions | Login session reuse via browser profiles |

---

## 5. Non-goals (MVP)

- Full autonomous agent browsing arbitrary websites
- Voice interface
- Mobile app
- Unlimited website support
- Open internet browsing

---

## 6. Core user flow (MVP)

1. **User sends chat request:**
   > "Sell my binoculars for 12,000 CZK on Sbazar"

2. **System:**
   - Converts request → structured task
   - Validates schema (Spec Kit / Zod)

3. **User reviews task:**
   - Title
   - Price
   - Description

4. **User approves**

5. **Worker executes:**
   - Logs into Sbazar
   - Creates listing
   - Uploads images
   - Publishes

6. **System** reports result to UI (progress, history, success/failure)

---

## 7. Key features

### 7.1 Chat interface

| Capability | MVP |
| ---------- | --- |
| Text input | Yes |
| Task history | Yes |
| Approval step | Yes — required before execution |

### 7.2 Task generation

| Capability | MVP |
| ---------- | --- |
| LLM intent → structured JSON | Yes |
| Schema validation | Yes — Spec Kit |
| Direct AI browser control | **No** |

### 7.3 Workflow execution

| Capability | MVP |
| ---------- | --- |
| Deterministic Playwright automation | Yes |
| Integrations | **Sbazar only** |

### 7.4 Credential management

| Capability | MVP |
| ---------- | --- |
| Encrypted storage | Yes |
| Session reuse | Yes — per-user browser profiles |
| AI access to secrets | **No** |

---

## 8. Future features

| Feature | Phase / notes |
| ------- | ------------- |
| Rohlik shopping automation | Phase 2 — see [agile-project-plan.md](./agile-project-plan.md) |
| Voice input/output | Phase 3 |
| Mobile app (SwiftUI) | Phase 4 |
| Multi-user support | Post-MVP product expansion |
| Scheduling automation | Phase 3 |
| AI memory / preferences | Later — personalization without breaking task contracts |

---

## 9. Traceability

| PRD section | Detailed specs |
| ----------- | -------------- |
| Sprints, DoD, timeline | [agile-project-plan.md](./agile-project-plan.md) |
| FR/NFR tables | [requirements.md](./requirements.md) |
| Components, security | [architecture.md](./architecture.md) |
| Google SSO, credentials | [authentication.md](./authentication.md), [credential-vault.md](./credential-vault.md) |
