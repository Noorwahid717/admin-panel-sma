import { rest } from "msw";

// Example handlers — extend these to mock your API routes used by the admin app
export const handlers = [
  // health check
  rest.get("/api/health", (_req: unknown, res: any, ctx: any) => {
    return res(ctx.status(200), ctx.json({ status: "ok" }));
  }),

  // Example: fetch current user
  rest.get("/api/users/me", (_req: unknown, res: any, ctx: any) => {
    return res(
      ctx.status(200),
      ctx.json({ id: "mock-user", email: "dev@example.com", role: "admin" })
    );
  }),
];

export default handlers;
