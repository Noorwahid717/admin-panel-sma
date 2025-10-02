import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import { eq, desc } from "drizzle-orm";
import { refreshTokens, users } from "../../src/db/schema";
import {
  setupE2EApp,
  teardownE2EApp,
  resetAuthState,
  decodeJwt,
  type E2EAppContext,
} from "./setup";

describe("Auth refresh rotation", () => {
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

  it("rotates refresh tokens, revokes previous JTI, and records audit metadata", async () => {
    const password = "StrongPass123!@";
    const email = "rotate@example.com";
    const user = await ctx.usersService.create({
      email,
      password,
      fullName: "Rotate Tester",
      role: "SUPERADMIN",
    });

    const loginResponse = await ctx.request
      .post("/api/v1/auth/login")
      .set("X-Forwarded-For", "203.0.113.5")
      .set("User-Agent", "VitestLogin/1.0")
      .send({ email, password });

    expect(loginResponse.status).toBe(201);

    const firstRefreshToken = loginResponse.body.refreshToken as string;
    expect(firstRefreshToken).toBeTruthy();

    const refreshResponse = await ctx.request
      .post("/api/v1/auth/refresh")
      .set("X-Forwarded-For", "198.51.100.10")
      .set("User-Agent", "VitestRefresh/1.0")
      .send({ refreshToken: firstRefreshToken });

    expect(refreshResponse.status).toBe(201);

    const secondRefreshToken = refreshResponse.body.refreshToken as string;
    expect(secondRefreshToken).toBeTruthy();
    expect(secondRefreshToken).not.toEqual(firstRefreshToken);

    await ctx.request
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: firstRefreshToken })
      .expect(401);

    const firstJti = decodeJwt(firstRefreshToken).tokenId as string;
    const secondJti = decodeJwt(secondRefreshToken).tokenId as string;

    const tokenRows = await ctx.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.userId, user.id))
      .orderBy(desc(refreshTokens.createdAt));

    expect(tokenRows).toHaveLength(2);

    const firstRecord = tokenRows.find((row) => row.jti === firstJti);
    const secondRecord = tokenRows.find((row) => row.jti === secondJti);

    expect(firstRecord?.revokedAt).not.toBeNull();
    expect(firstRecord?.userAgent).toBe("VitestLogin/1.0");
    expect(firstRecord?.ipAddress).toBe("203.0.113.5");

    expect(secondRecord?.revokedAt).toBeNull();
    expect(secondRecord?.userAgent).toBe("VitestRefresh/1.0");
    expect(secondRecord?.ipAddress).toBe("198.51.100.10");
  });
});
