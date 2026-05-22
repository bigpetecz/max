# Task contracts (Spec Kit)

Each file defines one `taskType` for `libs/spec-kit` Zod schemas and AI output validation.

| taskType | Doc | Integration |
| -------- | --- | ----------- |
| `sbazar.createListing` | [sbazar.createListing.md](./sbazar.createListing.md) | sbazar |
| `sbazar.establishSession` | [sbazar.establishSession.md](./sbazar.establishSession.md) | sbazar (internal / setup) |

AI may only emit `taskType` values listed here (whitelist).
