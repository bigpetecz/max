# Architecture decision records (ADRs)

We use [Michael Nygard’s ADR format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).

## Index

| ADR                                                   | Status       | Title                                        |
| ----------------------------------------------------- | ------------ | -------------------------------------------- |
| [0000](./0000-template.md)                            | Template     | ADR template (do not approve as-is)          |
| [0001](./0001-authentication-google-sso.md)           | **Accepted** | Platform authentication with Google SSO      |
| [0002](./0002-credential-vault-and-worker-handoff.md) | **Accepted** | Credential vault and worker handoff          |
| [0003](./0003-database-postgresql-prisma.md)          | **Accepted** | PostgreSQL with Prisma                       |
| [0004](./0004-mvp-runtime-decisions.md)               | **Accepted** | API prefix, OAuth, polling, approval, Ollama |

## Naming

- File: `NNNN-short-title.md` (zero-padded number, kebab-case title)
- Status: `Proposed` → `Accepted` | `Rejected` | `Superseded by ADR-XXXX`

## When to write an ADR

- Choosing a framework, database, auth provider, or secrets strategy
- Defining API style or deployment model
- Any decision that would be expensive to reverse
