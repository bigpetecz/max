# API outline (Phase 0)

Proposed REST surface for agents implementing `apps/api`.

> **Documentation strategy:** Markdown here for planning. Once `apps/api` exists, **canonical spec = OpenAPI** from `@nestjs/swagger` (`/api/docs` + `apps/api/openapi.json`). See [api-documentation.md](./api-documentation.md). Keep this file as an index + internal/HMAC notes after Swagger exists.

**Auth:** session cookie from Google SSO unless noted. **Internal:** HMAC headers on worker routes.

## Public — auth

| Method | Path                    | Description                             |
| ------ | ----------------------- | --------------------------------------- |
| GET    | `/auth/google`          | Redirect or return Google authorize URL |
| GET    | `/auth/google/callback` | Exchange code, set session cookie       |
| POST   | `/auth/logout`          | Clear session                           |
| GET    | `/auth/me`              | `{ id, email, displayName }`            |

## Public — chat & tasks

| Method | Path                         | Description                                                           |
| ------ | ---------------------------- | --------------------------------------------------------------------- |
| POST   | `/chat/messages`             | `{ content }` → AI draft task                                         |
| GET    | `/chat/threads/:id/messages` | History                                                               |
| GET    | `/tasks`                     | List user tasks                                                       |
| GET    | `/tasks/:id`                 | Task + status + payload                                               |
| POST   | `/tasks/:id/approve`         | `PendingApproval` → enqueue                                           |
| POST   | `/tasks/:id/reject`          | Cancel draft                                                          |
| GET    | `/tasks/:id`                 | Poll for status (MVP — no SSE/WebSocket); optional `?since=` for chat |

## Public — integrations & credentials

| Method | Path                                     | Description                                       |
| ------ | ---------------------------------------- | ------------------------------------------------- |
| GET    | `/integrations`                          | `{ slug, connected, lastVerifiedAt }[]`           |
| POST   | `/integrations/sbazar/credentials`       | Store encrypted password `{ username, password }` |
| POST   | `/integrations/sbazar/establish-session` | Enqueue guided login job (Phase 0 shortcut)       |
| DELETE | `/integrations/sbazar/credentials`       | Disconnect                                        |

## Internal — worker only (HMAC)

| Method | Path                          | Body                                              | Response                                                 |
| ------ | ----------------------------- | ------------------------------------------------- | -------------------------------------------------------- |
| POST   | `/internal/credential-grants` | `{ jobId, taskId, timestamp }` + signature header | `{ kind, username?, password?, storageState? }` TTL ~60s |
| POST   | `/internal/storage-state`     | `{ integrationSlug, storageState }` + job context | 204 — worker uploads refreshed session                   |

### HMAC signing (worker → API)

```
signature = HMAC-SHA256(WORKER_SERVICE_HMAC_SECRET, `${jobId}:${taskId}:${timestamp}`)
Header: X-Worker-Signature: <hex>
Header: X-Worker-Timestamp: <unix ms>
```

Reject if timestamp skew > 30s or grant already consumed.

## Task status enum

`Draft` | `PendingApproval` | `Approved` | `Queued` | `Running` | `Succeeded` | `Failed` | `Rejected`

## Errors (consistent shape)

```json
{ "code": "SCHEMA_INVALID", "message": "...", "details": {} }
```

Codes: `UNAUTHORIZED`, `SCHEMA_INVALID`, `SESSION_EXPIRED`, `INTEGRATION_NOT_CONNECTED`, `GRANT_EXPIRED`.

## References

- [authentication.md](./authentication.md)
- [credential-vault.md](./credential-vault.md)
- [architecture.md](./architecture.md)
