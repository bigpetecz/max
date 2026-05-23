# API documentation strategy

How we document HTTP APIs for **humans**, **agents**, and **tools**.

## Recommendation: both markdown and Swagger (different roles)

| Layer              | Format                             | When                             | Audience                                     |
| ------------------ | ---------------------------------- | -------------------------------- | -------------------------------------------- |
| **Planning**       | [api-outline.md](./api-outline.md) | Before / during Phase 0 scaffold | Agents, quick agreement on routes            |
| **Implementation** | **OpenAPI via `@nestjs/swagger`**  | As soon as `apps/api` exists     | Humans (Swagger UI), codegen, contract tests |
| **Agent shortcut** | `apps/api/openapi.json` (exported) | Committed or CI artifact         | Coding agents — machine-readable             |

**Do not** maintain two diverging sources forever. Rule:

1. **Now:** `api-outline.md` is the contract for Phase 0 planning.
2. **After first controller lands:** Nest decorators become **source of truth**.
3. **Keep `api-outline.md`** as a one-page index (or delete sections duplicated in Swagger) and add at the top: _“Canonical: `apps/api/openapi.json` or `/api/docs`.”_

### Why Swagger (OpenAPI), not markdown alone?

- DTOs and response types stay aligned with code
- Swagger UI for manual testing (OAuth callback, approve task, etc.)
- Agents can read `openapi.json` without parsing prose tables
- Contract tests (e.g. Schemathesis) optional later

### Why keep any markdown?

- Readable in GitHub without running the API
- Explains **HMAC internal routes** and security notes Swagger models poorly
- Stable read order in [IMPLEMENTATION.md](../IMPLEMENTATION.md) before code exists

## NestJS setup (when implementing `apps/api`)

```bash
# Typical packages
pnpm add @nestjs/swagger swagger-ui-express
```

- Decorate controllers with `@ApiTags`, `@ApiOperation`, `@ApiCookieAuth` (session).
- Mark internal worker routes `@ApiExcludeController()` or separate doc group — document HMAC in markdown only.
- Script (add to `package.json` later):

```json
"export:openapi": "node apps/api/scripts/export-openapi.js"
```

Writes `apps/api/openapi.json` for agents and CI.

## Internal routes (worker)

Keep **out of public Swagger** or in a separate “Internal” tag:

- `POST /internal/credential-grants`
- `POST /internal/storage-state`

Document signing and threat model in [credential-vault.md](./credential-vault.md) and [api-outline.md](./api-outline.md) § Internal.

## Agent read order (API work)

1. [api-outline.md](./api-outline.md) or `apps/api/openapi.json` (whichever exists)
2. [authentication.md](./authentication.md)
3. [credential-vault.md](./credential-vault.md)
4. [api-documentation.md](./api-documentation.md) (this file)

## Decision

**Use Swagger/OpenAPI from code** as the long-term canonical API reference. **Use markdown outline** until the API project exists, then sync and narrow markdown to what OpenAPI does not capture (HMAC, security narrative).
