# Task: `sbazar.establishSession`

**Internal / setup** — captures Playwright `storageState` after user completes Sbazar login (Phase 0 shortcut). Not user-initiated via chat in MVP unless product adds it.

## Payload schema

```typescript
z.object({}); // empty payload
```

## Worker workflow

1. Launch headed browser (or user-assisted window).
2. User completes Sbazar login manually.
3. Export `storageState` → `POST /internal/storage-state` (API encrypts).
4. Mark integration `connected: true`.

## Notes

- Prefer this in Phase 0 over password form if faster to ship.
- Does not require approval step (non-destructive); still audit in `task_runs`.
