import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { setupE2EApp, teardownE2EApp, type E2EAppContext } from "./setup";

describe("CORS configuration", () => {
  let ctx: E2EAppContext;
  const allowedOrigin = "http://localhost:5173";
  const blockedOrigin = "https://malicious.example.com";

  beforeAll(async () => {
    ctx = await setupE2EApp();
  });

  afterAll(async () => {
    await teardownE2EApp(ctx);
  });

  it("allows whitelisted origins", async () => {
    const res = await ctx.request
      .options("/api/v1/auth/login")
      .set("Origin", allowedOrigin)
      .set("Access-Control-Request-Method", "POST")
      .expect(204);

    expect(res.headers["access-control-allow-origin"]).toBe(allowedOrigin);
  });

  it("rejects non-whitelisted origins", async () => {
    const res = await ctx.request
      .options("/api/v1/auth/login")
      .set("Origin", blockedOrigin)
      .set("Access-Control-Request-Method", "POST");

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
