Local dev stack (Postgres + Redis) and seeding

This repository includes a small Docker Compose setup for running a local Postgres + Redis stack and a helper service to run the API seed script inside a Node container.

Start the database and redis services:

docker compose -f docker-compose.dev.yml up -d

Run the seeder (uses the project's pnpm lock to install only the API package deps and run the seed script):

docker compose -f docker-compose.dev.yml -f docker-compose.seed.yml up --abort-on-container-exit --exit-code-from seed

This will:

- Start Postgres and Redis defined in docker-compose.dev.yml
- Launch a Node container to run the seed script (apps/api/src/db/seed.ts)
- Exit with the seed service's exit code (0 for success)

Notes:

- The seed uses DATABASE_URL=postgres://sma:sma@postgres:5432/sma_dev and REDIS_URL=redis://redis:6379 inside the seed container (these point to the docker service names).
- If you prefer to run the seed locally without Docker:
  - Ensure Postgres and Redis are running and set DATABASE_URL and REDIS_URL accordingly
  - Run: pnpm --filter @apps/api run seed

If you want, I can also add a compose target to run the API server and the admin frontend in dev mode.
