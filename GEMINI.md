# GEMINI.md

## Project Overview

This is a pnpm monorepo for a student attendance and grading management platform. It consists of three main applications:

- **`@apps/api`**: A NestJS-based API that serves as the central backend for the platform. It uses Drizzle ORM for database access, BullMQ for background job processing, and Passport for authentication.
- **`@apps/worker`**: A Node.js application that processes background jobs from a BullMQ queue.
- **`@apps/admin`**: A Vite-based admin panel built with React and `@refinedev/antd`. It provides a user interface for managing the platform's data.

The project uses a PostgreSQL database and Redis for the message queue.

## Building and Running

### Development

To run all services in development mode, use the following command:

```bash
pnpm dev
```

This will start the API, worker, and admin panel in parallel.

- API: `http://localhost:3000/api/v1`
- Admin: `http://localhost:5173`

### Build

To build all applications, run:

```bash
pnpm build
```

### Testing

To run all tests, run:

```bash
pnpm test
```

## Development Conventions

- **Linting**: ESLint is used for linting. To run the linter, use `pnpm lint`.
- **Formatting**: Prettier is used for code formatting. To format the code, use `pnpm format`.
- **Git Hooks**: Husky is used to run pre-commit hooks.
- **Database Migrations**: `drizzle-kit` is used for database migrations.
  - `pnpm --filter @apps/api migrate:generate`: Generate a new migration.
  - `pnpm --filter @apps/api migrate:push`: Apply migrations.
- **Database Seeding**: `pnpm --filter @apps/api seed` to seed the database.
