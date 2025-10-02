import { UnauthorizedException } from "@nestjs/common";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { Request } from "express";
import { AuthService } from "./auth.service";
import { refreshTokens, users } from "../../db/schema";
import type { Tokens, AuthenticatedUser } from "@api/auth/auth.types";
import type { EnvironmentVariables } from "../../config/env.validation";
import type { ConfigService } from "@nestjs/config";
import type { JwtService } from "@nestjs/jwt";
import type { UsersService } from "../users/users.service";
import type { RedisService } from "../../infrastructure/redis/redis.service";
import type { Database } from "../../db/client";

type ExposedAuthService = {
  getConfigNumber: (key: keyof EnvironmentVariables, fallback: number) => number;
  getConfigString: (key: keyof EnvironmentVariables, fallback?: string) => string;
  loginAttemptKey: (email: string, ip: string) => string;
  loginBlockKey: (email: string, ip: string) => string;
  mapUser: (user: typeof users.$inferSelect) => AuthenticatedUser;
  getRequestIp: (request?: Request) => string;
  getUserAgent: (request?: Request) => string;
  extractRequestContext: (request?: Request) => { ip: string; userAgent: string };
  registerFailedAttempt: (email: string, ip: string) => Promise<void>;
  clearLoginAttempts: (email: string, ip: string) => Promise<void>;
  ensureNotLocked: (email: string, ip: string) => Promise<void>;
  persistRefreshToken: (
    user: AuthenticatedUser,
    tokenId: string,
    context: { ip: string; userAgent: string }
  ) => Promise<void>;
  markTokenRevoked: (recordId: string) => Promise<void>;
  issueTokens: (
    user: AuthenticatedUser,
    context: { ip: string; userAgent: string }
  ) => Promise<Tokens>;
};

interface Mocks {
  service: AuthService;
  configGet: ReturnType<typeof vi.fn>;
  redis: {
    exists: ReturnType<typeof vi.fn>;
    ttl: ReturnType<typeof vi.fn>;
    incr: ReturnType<typeof vi.fn>;
    expire: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    del: ReturnType<typeof vi.fn>;
  };
  jwtService: { signAsync: ReturnType<typeof vi.fn> };
  db: {
    insert: ReturnType<typeof vi.fn>;
    insertValues: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    updateSet: ReturnType<typeof vi.fn>;
    updateWhere: ReturnType<typeof vi.fn>;
  };
}

const createAuthService = (): Mocks => {
  const configGet = vi.fn();

  const redis = {
    exists: vi.fn().mockResolvedValue(0),
    ttl: vi.fn().mockResolvedValue(-1),
    incr: vi.fn().mockResolvedValue(1),
    expire: vi.fn().mockResolvedValue(1),
    set: vi.fn().mockResolvedValue("OK"),
    del: vi.fn().mockResolvedValue(1),
  };

  const redisService = { client: redis } as const;

  const jwtService = {
    signAsync: vi.fn().mockResolvedValue("signed-token"),
  } as const;

  const insertValues = vi.fn().mockResolvedValue(undefined);
  const insert = vi.fn().mockReturnValue({ values: insertValues });
  const updateWhere = vi.fn().mockResolvedValue(undefined);
  const updateSet = vi.fn().mockReturnValue({ where: updateWhere });
  const update = vi.fn().mockReturnValue({ set: updateSet });

  const dbQuery = {
    refreshTokens: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
  };

  const db = {
    insert,
    insertValues,
    update,
    updateSet,
    updateWhere,
    query: dbQuery,
  };

  const usersService = {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
  };

  const service = new AuthService(
    usersService as unknown as UsersService,
    jwtService as unknown as JwtService,
    { get: configGet } as unknown as ConfigService<EnvironmentVariables>,
    redisService as unknown as RedisService,
    {
      insert: insert as unknown,
      update: update as unknown,
      query: dbQuery,
    } as unknown as Database
  );

  return {
    service,
    configGet,
    redis,
    jwtService: jwtService,
    db,
  };
};

const resetEnv = (key: string) => {
  delete process.env[key];
};

describe("AuthService helper behaviour", () => {
  let mocks: Mocks;
  let exposed: ExposedAuthService;

  beforeEach(() => {
    mocks = createAuthService();
    exposed = mocks.service as unknown as ExposedAuthService;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetEnv("AUTH_MAX_LOGIN_ATTEMPTS");
    resetEnv("AUTH_LOCKOUT_DURATION");
    resetEnv("JWT_ACCESS_TTL");
    resetEnv("JWT_REFRESH_TTL");
    resetEnv("JWT_ACCESS_SECRET");
    resetEnv("JWT_REFRESH_SECRET");
  });

  it("getConfigNumber prefers numeric config values", () => {
    mocks.configGet.mockImplementation((key) => (key === "ARGON2_MEMORY_COST" ? 2048 : undefined));
    const result = exposed.getConfigNumber("ARGON2_MEMORY_COST", 1);
    expect(result).toBe(2048);
  });

  it("getConfigNumber falls back to environment variables", () => {
    mocks.configGet.mockImplementation(() => undefined);
    process.env.ARGON2_TIME_COST = "7";
    const result = exposed.getConfigNumber("ARGON2_TIME_COST", 2);
    expect(result).toBe(7);
    resetEnv("ARGON2_TIME_COST");
  });

  it("getConfigNumber uses fallback when config and env absent", () => {
    mocks.configGet.mockImplementation(() => undefined);
    const result = exposed.getConfigNumber("JWT_ACCESS_TTL", 900);
    expect(result).toBe(900);
  });

  it("getConfigString returns config strings as-is", () => {
    mocks.configGet.mockImplementation((key) =>
      key === "JWT_ACCESS_SECRET" ? "secret" : undefined
    );
    const result = exposed.getConfigString("JWT_ACCESS_SECRET", "fallback");
    expect(result).toBe("secret");
  });

  it("getConfigString converts numeric config values to strings", () => {
    mocks.configGet.mockImplementation((key) => (key === "JWT_REFRESH_TTL" ? 3600 : undefined));
    const result = exposed.getConfigString("JWT_REFRESH_TTL", "0");
    expect(result).toBe("3600");
  });

  it("getConfigString falls back to environment variables", () => {
    mocks.configGet.mockImplementation(() => undefined);
    process.env.JWT_REFRESH_SECRET = "env-secret";
    const result = exposed.getConfigString("JWT_REFRESH_SECRET", "fallback");
    expect(result).toBe("env-secret");
  });

  it("loginAttemptKey and loginBlockKey combine email and ip", () => {
    const attempt = exposed.loginAttemptKey("user@example.com", "127.0.0.1");
    const block = exposed.loginBlockKey("user@example.com", "127.0.0.1");
    expect(attempt).toBe("auth:attempt:user@example.com:127.0.0.1");
    expect(block).toBe("auth:block:user@example.com:127.0.0.1");
  });

  it("mapUser returns an authenticated user payload", () => {
    const mapped = exposed.mapUser({
      id: "user-1",
      email: "test@example.com",
      fullName: "Test User",
      role: "SUPERADMIN",
      teacherId: "teacher-1",
      studentId: "student-1",
    } as typeof users.$inferSelect);
    expect(mapped).toEqual({
      id: "user-1",
      email: "test@example.com",
      fullName: "Test User",
      role: "SUPERADMIN",
      teacherId: "teacher-1",
      studentId: "student-1",
    });
  });

  it("getRequestIp prefers first forwarded entry when array", () => {
    const req = {
      headers: { "x-forwarded-for": ["203.0.113.1, 203.0.113.2"] },
    } as unknown as Request;
    const ip = exposed.getRequestIp(req);
    expect(ip).toBe("203.0.113.1");
  });

  it("getRequestIp handles comma-separated forwarded header", () => {
    const req = {
      headers: { "x-forwarded-for": "198.51.100.5, 198.51.100.6" },
    } as unknown as Request;
    const ip = exposed.getRequestIp(req);
    expect(ip).toBe("198.51.100.5");
  });

  it("getRequestIp falls back to request.ip then socket", () => {
    const req = { headers: {}, ip: "192.0.2.9" } as unknown as Request;
    expect(exposed.getRequestIp(req)).toBe("192.0.2.9");

    const withSocket = {
      headers: {},
      socket: { remoteAddress: "192.0.2.10" },
    } as unknown as Request;
    expect(exposed.getRequestIp(withSocket)).toBe("192.0.2.10");
  });

  it("getRequestIp returns unknown when data missing", () => {
    const ip = exposed.getRequestIp(undefined);
    expect(ip).toBe("unknown");
  });

  it("getUserAgent joins array headers", () => {
    const req = { headers: { "user-agent": ["Agent/1", "Extra"] } } as unknown as Request;
    const ua = exposed.getUserAgent(req);
    expect(ua).toBe("Agent/1;Extra");
  });

  it("getUserAgent prefers header string and defaults to unknown", () => {
    const req = { headers: { "user-agent": "Agent/2" } } as unknown as Request;
    expect(exposed.getUserAgent(req)).toBe("Agent/2");
    expect(exposed.getUserAgent(undefined)).toBe("unknown");
  });

  it("extractRequestContext combines ip and user-agent", () => {
    const req = {
      headers: { "x-forwarded-for": "203.0.113.7", "user-agent": "Vitest" },
    } as unknown as Request;
    const context = exposed.extractRequestContext(req);
    expect(context).toEqual({ ip: "203.0.113.7", userAgent: "Vitest" });
  });

  it("registerFailedAttempt sets expiry on first attempt", async () => {
    mocks.redis.incr.mockResolvedValueOnce(1);
    await exposed.registerFailedAttempt("user@example.com", "127.0.0.1");
    expect(mocks.redis.incr).toHaveBeenCalledWith("auth:attempt:user@example.com:127.0.0.1");
    expect(mocks.redis.expire).toHaveBeenCalled();
    expect(mocks.redis.set).not.toHaveBeenCalled();
  });

  it("registerFailedAttempt blocks account when attempts exceed limit", async () => {
    process.env.AUTH_MAX_LOGIN_ATTEMPTS = "3";
    mocks.redis.incr.mockResolvedValueOnce(3);
    await exposed.registerFailedAttempt("user@example.com", "127.0.0.2");
    expect(mocks.redis.set).toHaveBeenCalledWith(
      "auth:block:user@example.com:127.0.0.2",
      "1",
      "EX",
      expect.any(Number)
    );
    expect(mocks.redis.del).toHaveBeenCalledWith("auth:attempt:user@example.com:127.0.0.2");
  });

  it("clearLoginAttempts deletes attempt and block keys", async () => {
    await exposed.clearLoginAttempts("user@example.com", "127.0.0.3");
    expect(mocks.redis.del).toHaveBeenCalledWith(
      "auth:attempt:user@example.com:127.0.0.3",
      "auth:block:user@example.com:127.0.0.3"
    );
  });

  it("ensureNotLocked does nothing when key absent", async () => {
    mocks.redis.exists.mockResolvedValueOnce(0);
    await expect(exposed.ensureNotLocked("user@example.com", "127.0.0.4")).resolves.toBeUndefined();
  });

  it("ensureNotLocked throws when lock key exists", async () => {
    mocks.redis.exists.mockResolvedValueOnce(1);
    mocks.redis.ttl.mockResolvedValueOnce(60);
    await expect(exposed.ensureNotLocked("user@example.com", "127.0.0.5")).rejects.toBeInstanceOf(
      UnauthorizedException
    );
  });

  it("persistRefreshToken stores refresh record", async () => {
    const user: AuthenticatedUser = {
      id: "user-123",
      email: "user@example.com",
      fullName: "User",
      role: "SUPERADMIN",
      teacherId: null,
      studentId: null,
    };
    await exposed.persistRefreshToken(user, "token-123", {
      ip: "127.0.0.6",
      userAgent: "Vitest",
    });
    expect(mocks.db.insert).toHaveBeenCalledWith(refreshTokens);
    const [[row]] = mocks.db.insertValues.mock.calls;
    expect(row.userId).toBe("user-123");
    expect(row.jti).toBe("token-123");
    expect(row.ipAddress).toBe("127.0.0.6");
  });

  it("markTokenRevoked updates refresh token record", async () => {
    await exposed.markTokenRevoked("record-1");
    expect(mocks.db.update).toHaveBeenCalledWith(refreshTokens);
    expect(mocks.db.updateSet).toHaveBeenCalledWith({ revokedAt: expect.any(Date) });
    expect(mocks.db.updateWhere).toHaveBeenCalled();
  });

  it("issueTokens signs access and refresh tokens", async () => {
    process.env.JWT_ACCESS_SECRET = "access";
    process.env.JWT_REFRESH_SECRET = "refresh";
    const user: AuthenticatedUser = {
      id: "user-456",
      email: "user@example.com",
      fullName: "User",
      role: "SUPERADMIN",
      teacherId: null,
      studentId: null,
    };
    const tokens = await exposed.issueTokens(user, {
      ip: "127.0.0.7",
      userAgent: "Vitest/3",
    });
    expect(mocks.jwtService.signAsync).toHaveBeenCalledTimes(2);
    expect(tokens.accessToken).toBe("signed-token");
    expect(tokens.refreshToken).toBe("signed-token");
  });
});
