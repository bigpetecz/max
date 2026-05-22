# ADR-0002: Credential vault and worker handoff

- **Status:** Accepted
- **Date:** 2026-05-22
- **Deciders:** Product owner (pending formal sign-off)
- **Supersedes:** —
- **Superseded by:** —

## Context

Workers need Sbazar (and later Rohlik) credentials or browser sessions to execute tasks. AI must never access secrets. Workers must not hold database credentials or master encryption keys. BullMQ jobs must not carry plaintext secrets.

## Decision

1. **Store** integration secrets in PostgreSQL using **envelope encryption** (per-row DEK, KEK in API environment only).
2. **Support two credential kinds:** `password` and encrypted Playwright `storage_state`.
3. **Hand off** secrets to workers via an **internal, job-scoped credential grant API** authenticated with **HMAC** (`WORKER_SERVICE_HMAC_SECRET`).
4. **Exclude** secrets from BullMQ job payloads and AI prompts.
5. **Phase 0** may prioritize guided login → `storage_state` capture; password vault UI can follow in Phase 1 per agile plan.

## Consequences

### Positive

- Clear trust boundary: only API decrypts
- Short-lived, auditable worker access
- Session reuse via `storage_state` reduces password handling
- Aligns with “worker has no DB secrets” architecture principle

### Negative / trade-offs

- Extra internal API surface to secure and test
- Clock skew / HMAC bugs can block runs
- KEK in env is weaker than cloud KMS until Phase 1+ hardening

## Alternatives considered

| Alternative | Why not chosen |
| ----------- | -------------- |
| Credentials in Redis job JSON | Persisted queue leakage risk |
| Worker reads DB directly | Expands compromise blast radius |
| Only passwords, no storage state | Poor UX; fragile sessions |
| Cloud KMS only (no app-level envelope) | Defer to production; envelope sufficient for MVP |

## References

- [credential-vault.md](../credential-vault.md)
- [architecture.md](../architecture.md)
