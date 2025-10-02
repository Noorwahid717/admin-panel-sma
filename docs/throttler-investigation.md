# Throttler Investigation Notes

_Last updated: 2025-10-02_

## Summary of Recent Changes

- Updated `apps/api/src/modules/auth/auth.controller.ts` to use `@Throttle(5, 60)` on the `login` and `refresh` handlers instead of the object-style decorator.
- Updated `apps/api/src/modules/storage/storage.controller.ts` to use `@Throttle(20, 60)` on the `presign` endpoint.
- Added temporary diagnostics in `apps/api/test/e2e/setup.ts` to log throttle metadata for `AuthController` and `StorageController` immediately after `app.init()`.
- Added temporary logging in `apps/api/test/e2e/auth.ratelimit.e2e-spec.ts` to print response headers for the over-limit requests.

## Current Test Status

Command:

```bash
pnpm --filter @apps/api test:e2e -- --run --file test/e2e/auth.ratelimit.e2e-spec.ts
```

Outcome: **Failed**

All three scenarios still return `201` instead of the expected `429`.

Observed headers on the failing responses:

- `X-RateLimit-Limit: 100`
- `X-RateLimit-Remaining: 99` (or `95` for the storage test)
- `X-RateLimit-Reset: 1`

This indicates the global throttler configuration (`limit: 100`, `ttl: 60`) is being applied, and the per-route settings defined via the `@Throttle` decorator are being ignored.

## Follow-Up Actions

1. **Decorator Signature Check** – Confirm the correct decorator usage for `@nestjs/throttler@6.4.0`. If the decorator still expects the object form (`@Throttle({ default: { ... } })`), revert to that pattern or adjust to the new API.
2. **Module Configuration** – Consider registering named throttlers via `ThrottlerModule.forRoot` and referencing them explicitly in the decorator, e.g. `@Throttle({ authLogin: { ... } })`, to override the global defaults.
3. **Cleanup** – Remove the temporary `console.log` statements in `setup.ts` and `auth.ratelimit.e2e-spec.ts` once the throttle behaviour matches expectations.
