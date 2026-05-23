# ADR-0003: PostgreSQL with Prisma

- **Status:** Accepted
- **Date:** 2026-05-22
- **Deciders:** Product owner
- **Supersedes:** —
- **Superseded by:** —

## Context

Max needs persistent storage for users, sessions, tasks, encrypted credentials, and audit rows. MongoDB + Mongoose was considered; relational integrity and existing specs favored SQL.

## Decision

Use **PostgreSQL** as the primary database and **Prisma** as the ORM in `apps/api`.

- Migrations via `prisma migrate`
- `DATABASE_URL` in API only (worker has no DB access per ADR-0002)
- Task `payload` stored as `Json` in Prisma; validation via Zod in `libs/spec-kit`

## Consequences

### Positive

- Aligns with architecture docs and credential grant model
- Strong typing, migrations, good NestJS integration (`@nestjs` + Prisma service)

### Negative / trade-offs

- Prisma schema must be kept in sync with spec-kit Zod (two sources — document task shapes in `docs/specs/tasks/`)

## Alternatives considered

| Alternative        | Why not chosen                                              |
| ------------------ | ----------------------------------------------------------- |
| MongoDB + Mongoose | Weaker fit for FKs, grants audit, and locked security model |
| TypeORM            | Valid; team chose Prisma                                    |

## References

- [architecture.md](../architecture.md)
- [IMPLEMENTATION.md](../../IMPLEMENTATION.md)
