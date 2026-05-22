# ADR-0004: MVP runtime decisions (API, approval, planner)

- **Status:** Accepted
- **Date:** 2026-05-22
- **Deciders:** Product owner

## Context

Final pre-scaffold choices for Phase 0 behavior and local LLM.

## Decisions

| Topic | Decision |
| ----- | -------- |
| API prefix | Global `/api` on NestJS |
| OAuth | **Industry standard:** Authorization Code + **PKCE**; **API** owns callback; **httpOnly** session cookie; validate Google `id_token` server-side ([authentication.md](../authentication.md)) |
| Task status to UI | **REST polling** only for MVP — no WebSocket, no SSE |
| Listing images | **Local file paths** in task payload; worker reads from disk |
| Approval | **One gate before execution:** user confirms structured plan (title, price, description); only then task is **queued**. Worker run includes publish — no second approval for MVP |
| Environment | **Root `.env`** for all apps (Nx) |
| Local planner | **Ollama** — primary model `qwen2.5:7b-instruct`; see IMPLEMENTATION.md § Ollama |

## Consequences

- UI polls `GET /api/tasks/:id` (e.g. every 2s while `Running`) instead of opening an event stream.
- OpenAI fallback remains optional and off by default in Phase 0.

## References

- [api-outline.md](../api-outline.md)
- [authentication.md](../authentication.md)
