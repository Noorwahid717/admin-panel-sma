import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { resetAuthState, setupE2EApp, teardownE2EApp, type E2EAppContext } from "./setup";

describe("Argon2 configuration", () => {
  let ctx: E2EAppContext;
  const memoryCost = 10999;
  const timeCost = 4;

  beforeAll(async () => {
    ctx = await setupE2EApp({
      ARGON2_MEMORY_COST: String(memoryCost),
      ARGON2_TIME_COST: String(timeCost),
    });
    await resetAuthState(ctx);
  });

  afterAll(async () => {
    await teardownE2EApp(ctx);
  });

  it("uses env-configured parameters for hashing", async () => {
    const created = await ctx.usersService.create({
      email: "argon-config@example.com",
      password: "ConfigCheck123!@",
      fullName: "Argon Config",
      role: "SUPERADMIN",
    });

    expect(created.password).toContain(`m=${memoryCost}`);
    expect(created.password).toContain(`t=${timeCost}`);
    expect(created.password.startsWith("$argon2id$")).toBe(true);

    await ctx.request
      .post("/api/v1/auth/login")
      .send({ email: "argon-config@example.com", password: "ConfigCheck123!@" })
      .expect(201);
  });
});
