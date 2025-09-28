# Copilot Instructions for admin-panel-sma

## Architecture snapshot

- pnpm workspace with `apps/api` (NestJS backend), `apps/shared` (Zod schemas/constants), plus `apps/worker` and `apps/admin` placeholders. Type aliases live in `tsconfig.base.json`.
- The API follows Nest modules per domain (`modules/*`) and central infrastructure layers (`infrastructure/database|redis|queue`). `AppModule` wires everything; every new module must be imported there.
- Database access goes through Drizzle ORM tables defined in `apps/api/src/db/schema.ts` and the typed client in `db/client.ts`. Queue work uses BullMQ queues provided by `QueueModule`.
- Shared validation contracts live in `apps/shared/src/schemas`. Controllers run all payloads through `ZodValidationPipe`, so reuse those schemas instead of redefining DTOs.
- Authorization combines JWT + role guard + ownership guard. Ownership checks rely on `OwnershipService` and the `@Ownership()` decorator metadata—set the right resource/param when adding privileged routes.

## Coding patterns to follow

- Prefer repositories/services for data access; controllers are thin and return service results.
- Use `nanoid()` for IDs and Drizzle `onConflictDoUpdate`/`onConflictDoNothing` for upserts.
- Inject the typed `Database` via `@Inject(DRIZZLE_CLIENT)`; avoid creating raw `Pool` instances in modules.
- When adding domain logic that needs cross-module helpers, add providers to `CommonModule` so guards/services can reuse them.
- Response shapes often include combined records (e.g., attendance returns joined student/class info); check neighboring services before introducing new projections.

## Commands & workflows

- Install deps with `pnpm install`. Use filters for subprojects, e.g. `pnpm --filter @apps/api dev|build|test`.
- Tests: `pnpm --filter @apps/api test` (Jest unit), `pnpm --filter @apps/api test:e2e` for e2e; shared package uses Vitest via `pnpm --filter @apps/shared test`.
- Build currently fails (`nest build`) until missing deps (`dotenv`, `date-fns`, `@types/pg`, `@types/passport-jwt`, etc.) and config issues (`drizzle.config.ts` credentials, `Ownership` decorator typing) are resolved—fix these before relying on CI success.
- Lint script expects ESLint v9 flat config; converting `.eslintrc.cjs` to `eslint.config.js` is pending. Until then, lint runs will error.

## Environment & external services

- Root `.env.example` plus `apps/api/.env.example` describe required variables. Set database, Redis, JWT secrets, and storage driver (`supabase` or `r2`). Supabase requires URL + keys + bucket; R2 needs account, key pair, bucket, and optional public base URL.
- Storage service (new module) presigns uploads via Supabase signed uploads or Cloudflare R2 presigned PUTs. When switching drivers, ensure corresponding env vars are populated.
- Queue operations require Redis; the report generation flow enqueues jobs on `REPORT_PDF_QUEUE` for a future worker in `apps/worker`.

## Common gotchas

- Whenever you add a new domain schema, update both Drizzle schema and the matching Zod schema under `apps/shared/src/schemas`; keep names consistent so DTO inference stays correct.
- Remember to export new shared schemas/types via `apps/shared/src/schemas/index.ts` and `types/index.ts` if needed.
- Guards require both role metadata (`@Roles(...)`) and, for fine-grained checks, `@Ownership`. Forgetting either will bypass desired protections.
- Use path aliases (`@shared/*`, `@api/*`) rather than long relative imports.

If anything here is unclear or missing, let me know so we can refine this guide.
