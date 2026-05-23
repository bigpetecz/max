# ADR-0001: Platform authentication with Google SSO

- **Status:** Accepted
- **Date:** 2026-05-22
- **Deciders:** Product owner (pending formal sign-off)
- **Supersedes:** —
- **Superseded by:** —

## Context

Max needs frictionless sign-up for a personal automation product. Users should not manage a separate Max password. Integration site logins (Sbazar) remain a distinct concern.

Forces:

- SPA (React) + API (NestJS) split
- MVP timeline (Phase 0)
- Security expectations for OAuth in browser apps (PKCE)

## Decision

Use **Google OAuth 2.0 / OpenID Connect** as the sole platform identity provider for MVP.

Implementation choices:

1. **Authorization Code flow with PKCE**
2. **API validates** Google `id_token` and maps `sub` → internal `users.id`
3. **Server-side session** via httpOnly cookie (preferred over long-lived JWT in `localStorage`)
4. API callback URL owns the client secret (not embedded in frontend)

## Consequences

### Positive

- No password reset / bcrypt scope for Max
- Familiar UX (“Sign in with Google”)
- Clear separation from integration credentials

### Negative / trade-offs

- Users without Google accounts cannot sign in (acceptable for MVP personal tool)
- Dependency on Google availability and OAuth consent configuration
- Email `sub` mapping must handle Google account changes carefully

## Alternatives considered

| Alternative              | Why not chosen                                 |
| ------------------------ | ---------------------------------------------- |
| Email + password         | Operational burden; not requested              |
| Magic link               | Extra infra; Google SSO already requested      |
| Auth0 / Clerk            | Valid later; adds cost/complexity for solo MVP |
| JWT-only in localStorage | Worse XSS surface; harder revocation           |

## References

- [authentication.md](../authentication.md)
- [architecture.md](../architecture.md)
