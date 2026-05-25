# Max

Nx monorepo for the Max project.

## Project documentation

Documentation: **[docs/PRE-PHASE-0.md](./docs/PRE-PHASE-0.md)** → **[docs/IMPLEMENTATION.md](./docs/IMPLEMENTATION.md)** · Agents: **[AGENTS.md](./AGENTS.md)** · After Nx: **[docs/POST-BOOTSTRAP-TODO.md](./docs/POST-BOOTSTRAP-TODO.md)**

---

## Current workspace status

- Nx bootstrap completed: `web`, `api`, `worker`, `spec-kit`, `shared`, `integrations/sbazar`
- API scaffolded with NestJS + SWC and `/api/health` dependency checks
- Worker scaffolded with startup dependency checks and `/health`
- Prisma configured in `apps/api/prisma/schema.prisma` with initial migration applied
- Local infra configured in `docker-compose.yml` (Postgres + Redis)
- Integration smoke tests added for API and worker
- Google SSO baseline implemented with API refresh/logout flow and protected API access
- Web auth gate + chat shell implemented and connected to API chat streaming route

## Quickstart

```sh
pnpm install
pnpm db:up
pnpm prisma:migrate:dev --name init
pnpm dev
```

## Useful scripts

```sh
# Run API + web + worker
pnpm dev

# Build all apps
pnpm build

# Start/stop local Postgres + Redis
pnpm db:up
pnpm db:down

# Prisma
pnpm prisma:generate
pnpm prisma:migrate:dev --name <migration-name>
pnpm prisma:studio

# Integration smoke checks
pnpm nx run api:integration
pnpm nx run worker:integration
pnpm test:integration
```

## Nx projects

```sh
pnpm nx show projects
```

Current projects: `web`, `api`, `worker`, `spec-kit`, `shared`, `sbazar`.
