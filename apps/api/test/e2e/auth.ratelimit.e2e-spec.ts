import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import { setupE2EApp, teardownE2EApp, resetAuthState, type E2EAppContext } from "./setup";

describe("Auth and storage rate limiting", () => {
  let ctx: E2EAppContext;

  beforeAll(async () => {
    ctx = await setupE2EApp();
  });

  afterAll(async () => {
    await teardownE2EApp(ctx);
  });

  beforeEach(async () => {
    await resetAuthState(ctx);
  });

  it("limits repeated login attempts", async () => {
    const password = "LoginRate123!@";
    await ctx.usersService.create({
      email: "ratelimit-login@example.com",
      password,
      fullName: "Rate Limit Login",
      role: "SUPERADMIN",
    });

    for (let i = 0; i < 5; i++) {
      await ctx.request
        .post("/api/v1/auth/login")
        .send({ email: "ratelimit-login@example.com", password })
        .expect(201);
    }

    const sixth = await ctx.request
      .post("/api/v1/auth/login")
      .send({ email: "ratelimit-login@example.com", password });

    expect(sixth.status).toBe(429);
    expect(sixth.body.message).toMatch(/Too Many Requests/i);
  });

  it("limits refresh token exchanges", async () => {
    const password = "RefreshRate123!@";
    await ctx.usersService.create({
      email: "ratelimit-refresh@example.com",
      password,
      fullName: "Rate Limit Refresh",
      role: "SUPERADMIN",
    });

    const login = await ctx.request
      .post("/api/v1/auth/login")
      .send({ email: "ratelimit-refresh@example.com", password })
      .expect(201);

    let refreshToken = login.body.refreshToken as string;

    for (let i = 0; i < 5; i++) {
      const res = await ctx.request.post("/api/v1/auth/refresh").send({ refreshToken }).expect(201);
      refreshToken = res.body.refreshToken as string;
    }

    const limited = await ctx.request.post("/api/v1/auth/refresh").send({ refreshToken });

    expect(limited.status).toBe(429);
    expect(limited.body.message).toMatch(/Too Many Requests/i);
  });

  it("limits storage presign requests", async () => {
    const password = "StorageRate123!@";
    await ctx.usersService.create({
      email: "ratelimit-storage@example.com",
      password,
      fullName: "Rate Limit Storage",
      role: "SUPERADMIN",
    });

    const login = await ctx.request
      .post("/api/v1/auth/login")
      .send({ email: "ratelimit-storage@example.com", password })
      .expect(201);

    const accessToken = login.body.accessToken as string;

    for (let i = 0; i < 20; i++) {
      await ctx.request
        .post("/api/v1/storage/presign")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ fileName: `test-${i}.png`, contentType: "image/png" })
        .expect((res) => expect([200, 201]).toContain(res.status));
    }

    const limited = await ctx.request
      .post("/api/v1/storage/presign")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ fileName: "limited.png", contentType: "image/png" });

    expect(limited.status).toBe(429);
    expect(limited.body.message).toMatch(/Too Many Requests/i);
  });
});
