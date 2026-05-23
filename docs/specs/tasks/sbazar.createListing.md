# Task: `sbazar.createListing`

Creates and publishes a classified listing on Sbazar after user approval.

## Payload schema (Zod sketch)

| Field         | Type     | Required | Rules                                                  |
| ------------- | -------- | -------- | ------------------------------------------------------ |
| `title`       | string   | yes      | 3–120 chars                                            |
| `price`       | number   | yes      | CZK, integer, > 0                                      |
| `description` | string   | yes      | 10–5000 chars                                          |
| `imagePaths`  | string[] | no       | Local paths worker resolves in Phase 0; Q5 for storage |

```typescript
// libs/spec-kit — implement from this spec
z.object({
  title: z.string().min(3).max(120),
  price: z.number().int().positive(),
  description: z.string().min(10).max(5000),
  imagePaths: z.array(z.string()).optional(),
});
```

## Example (AI output)

```json
{
  "taskType": "sbazar.createListing",
  "payload": {
    "title": "Nikon Monarch 10x42",
    "price": 12000,
    "description": "Binoculars in excellent condition."
  }
}
```

## Worker workflow (deterministic)

1. Obtain credential grant (`sbazar`).
2. `browser.newContext({ storageState })` or login with password.
3. Navigate to create listing flow.
4. Fill title, price, description.
5. Upload images if `imagePaths` present.
6. Submit / publish.
7. Return listing URL or id in run result.

## Prerequisites

- User approved task while `PendingApproval`.
- Integration connected (grant succeeds).

## FR traceability

FR-007, FR-008, FR-009, NFR-001 (approval before publish).
