import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { refreshTokens } from "../../src/db/schema";
import {
  setupE2EApp,
  teardownE2EApp,
  resetAuthState,
  decodeJwt,
  type E2EAppContext,
} from "./setup";

describe("Auth logout behaviour", () => {
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

  it("revokes all active refresh tokens when all flag is provided", async () => {
    const password = "ComplexPass123!@";
    const user = await ctx.usersService.create({
      email: "logout-all@example.com",
      password,
      fullName: "Logout All",
      role: "SUPERADMIN",
    });

    await ctx.request.post("/api/v1/auth/login").send({ email: user.email, password }).expect(201);

    const secondLogin = await ctx.request
      .post("/api/v1/auth/login")
      .send({ email: user.email, password })
      .expect(201);

    const accessToken = secondLogin.body.accessToken as string;
    const refreshToken = secondLogin.body.refreshToken as string;

    await ctx.request
      .post("/api/v1/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ all: true })
      .expect(200);

    const rows = await ctx.db.select().from(refreshTokens).where(eq(refreshTokens.userId, user.id));

    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows.every((row) => row.revokedAt !== null)).toBe(true);

    await ctx.request.post("/api/v1/auth/refresh").send({ refreshToken }).expect(401);
  });

  it("revokes only the specified JTI when provided via query", async () => {
    const password = "SpecificPass123!@";
    const user = await ctx.usersService.create({
      email: "logout-jti@example.com",
      password,
      fullName: "Logout JTI",
      role: "SUPERADMIN",
    });

    const login = await ctx.request
      .post("/api/v1/auth/login")
      .send({ email: user.email, password })
      .expect(201);

    const accessToken = login.body.accessToken as string;
    const refreshToken = login.body.refreshToken as string;
    const jti = decodeJwt(refreshToken).tokenId as string;

    await ctx.request
      .post(`/api/v1/auth/logout?jti=${jti}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    const rows = await ctx.db.select().from(refreshTokens).where(eq(refreshTokens.userId, user.id));

    expect(rows).toHaveLength(1);
    expect(rows[0]?.jti).toBe(jti);
    expect(rows[0]?.revokedAt).not.toBeNull();

    await ctx.request.post("/api/v1/auth/refresh").send({ refreshToken }).expect(401);
  });
});
