import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  setupE2EApp,
  teardownE2EApp,
  resetAuthState,
  resetThrottlerState,
  type E2EAppContext,
} from "./setup";

const SUPERADMIN_EMAIL = "policy-admin@example.com";
const SUPERADMIN_PASSWORD = "AdminPolicy123!@";

async function bootstrapSuperAdmin(ctx: E2EAppContext) {
  await ctx.usersService.create({
    email: SUPERADMIN_EMAIL,
    password: SUPERADMIN_PASSWORD,
    fullName: "Policy Admin",
    role: "SUPERADMIN",
  });

  const login = await ctx.request
    .post("/api/v1/auth/login")
    .send({ email: SUPERADMIN_EMAIL, password: SUPERADMIN_PASSWORD })
    .expect(201);

  return login.body.accessToken as string;
}

describe("Password policy and lockout", () => {
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

  it("rejects weak passwords during registration", async () => {
    const accessToken = await bootstrapSuperAdmin(ctx);

    const weak = await ctx.request
      .post("/api/v1/auth/register")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        email: "weak-password@example.com",
        password: "weakpassword123!@",
        fullName: "Weak Password",
        role: "ADMIN",
      })
      .expect(400);

    expect(weak.body.errors.fieldErrors.password[0]).toContain("uppercase");

    const strong = await ctx.request
      .post("/api/v1/auth/register")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        email: "strong-password@example.com",
        password: "StrongPassword123!@",
        fullName: "Strong Password",
        role: "ADMIN",
      })
      .expect(201);

    expect(strong.body.accessToken).toBeTruthy();
  });

  it("locks account after repeated failed login attempts", async () => {
    const password = "LockoutPass123!@";
    await ctx.usersService.create({
      email: "lockout@example.com",
      password,
      fullName: "Lockout User",
      role: "SUPERADMIN",
    });

    for (let i = 0; i < 5; i++) {
      await ctx.request
        .post("/api/v1/auth/login")
        .send({ email: "lockout@example.com", password: "WrongPass1!" })
        .expect(401);
    }

    resetThrottlerState(ctx);

    const locked = await ctx.request
      .post("/api/v1/auth/login")
      .send({ email: "lockout@example.com", password })
      .expect(401);

    expect(locked.body.message).toMatch(/temporarily locked/i);
  });
});
