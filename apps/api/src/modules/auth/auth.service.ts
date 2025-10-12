import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { verify } from "argon2";
import { nanoid } from "nanoid";
import type { Request } from "express";
import type { LoginInput, LogoutInput, RefreshInput, RegisterUserInput } from "@shared/schemas";
import { UsersService } from "../users/users.service";
import { RedisService } from "../../infrastructure/redis/redis.service";
import { DRIZZLE_CLIENT } from "../../infrastructure/database/database.constants";
import type { Database } from "@shared/db/client";
import { refreshTokens, users } from "@shared/db/schema";
import type { EnvironmentVariables } from "../../config/env.validation";
import type {
  AppRole,
  AuthenticatedUser,
  JwtPayload,
  RequestUser,
  Tokens,
} from "@api/auth/auth.types";
import { and, eq, isNull } from "drizzle-orm";

type RequestContext = {
  ip: string;
  userAgent: string;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @Inject(UsersService) private readonly usersService: UsersService,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(ConfigService) private readonly configService: ConfigService<EnvironmentVariables>,
    @Inject(RedisService) private readonly redisService: RedisService,
    @Inject(DRIZZLE_CLIENT) private readonly db: Database
  ) {}

  private getConfigNumber(key: keyof EnvironmentVariables, fallback: number) {
    const value = this.configService?.get(key, { infer: true });
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    const raw = process.env[key as string];
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private getConfigString(key: keyof EnvironmentVariables, fallback = "") {
    const value = this.configService?.get(key, { infer: true });
    if (typeof value === "string") {
      return value;
    }
    if (typeof value === "number") {
      return String(value);
    }

    const raw = process.env[key as string];
    if (raw !== undefined) {
      return raw;
    }

    return fallback;
  }

  private get accessTtl() {
    return this.getConfigNumber("JWT_ACCESS_TTL", 900);
  }

  private get refreshTtl() {
    return this.getConfigNumber("JWT_REFRESH_TTL", 2592000);
  }

  private get maxLoginAttempts() {
    return this.getConfigNumber("AUTH_MAX_LOGIN_ATTEMPTS", 5);
  }

  private get lockoutDuration() {
    return this.getConfigNumber("AUTH_LOCKOUT_DURATION", 900);
  }

  private async buildTokens(user: AuthenticatedUser, tokenId: string): Promise<Tokens> {
    const payload: JwtPayload = {
      sub: user.id,
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      teacherId: user.teacherId,
      studentId: user.studentId,
      tokenId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.getConfigString("JWT_ACCESS_SECRET"),
        expiresIn: this.accessTtl,
        jwtid: tokenId,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.getConfigString("JWT_REFRESH_SECRET"),
        expiresIn: this.refreshTtl,
        jwtid: tokenId,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTtl,
      refreshExpiresIn: this.refreshTtl,
      tokenType: "Bearer",
    };
  }

  private loginAttemptKey(email: string, ip: string) {
    return `auth:attempt:${email}:${ip}`;
  }

  private loginBlockKey(email: string, ip: string) {
    return `auth:block:${email}:${ip}`;
  }

  private mapUser(user: typeof users.$inferSelect): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as AppRole,
      teacherId: user.teacherId,
      studentId: user.studentId,
    };
  }

  private extractRequestContext(request?: Request): RequestContext {
    return {
      ip: this.getRequestIp(request),
      userAgent: this.getUserAgent(request),
    };
  }

  private getRequestIp(request?: Request) {
    const forwardedFor = request?.headers["x-forwarded-for"];
    if (Array.isArray(forwardedFor)) {
      if (forwardedFor.length > 0) {
        return forwardedFor[0].split(",")[0].trim();
      }
    } else if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
      return forwardedFor.split(",")[0].trim();
    }

    return request?.ip ?? request?.socket?.remoteAddress ?? "unknown";
  }

  private getUserAgent(request?: Request) {
    const header = request?.headers["user-agent"];
    if (Array.isArray(header)) {
      return header.join(";");
    }
    return header ?? "unknown";
  }

  private async ensureNotLocked(email: string, ip: string) {
    const blockKey = this.loginBlockKey(email, ip);
    try {
      const isBlocked = await this.redisService.client.exists(blockKey);

      if (isBlocked) {
        const ttl = await this.redisService.client.ttl(blockKey);
        throw new UnauthorizedException(
          ttl > 0
            ? `Account temporarily locked. Try again in ${ttl} seconds.`
            : "Account temporarily locked."
        );
      }
    } catch (err) {
      // If Redis fails (rate limit, network), don't block login flow — log and continue
      this.logger.warn(`Redis unavailable in ensureNotLocked: ${String(err)}`);
      return;
    }
  }

  private async registerFailedAttempt(email: string, ip: string) {
    const attemptKey = this.loginAttemptKey(email, ip);
    const blockKey = this.loginBlockKey(email, ip);
    try {
      const attempts = await this.redisService.client.incr(attemptKey);
      if (attempts === 1) {
        await this.redisService.client.expire(attemptKey, this.lockoutDuration);
      }

      if (attempts >= this.maxLoginAttempts) {
        await this.redisService.client.set(blockKey, "1", "EX", this.lockoutDuration);
        await this.redisService.client.del(attemptKey);
      }
    } catch (err) {
      // Log and fail-open: if Redis can't be updated, don't prevent further login attempts
      this.logger.warn(`Redis unavailable in registerFailedAttempt: ${String(err)}`);
      return;
    }
  }

  private async clearLoginAttempts(email: string, ip: string) {
    const attemptKey = this.loginAttemptKey(email, ip);
    const blockKey = this.loginBlockKey(email, ip);
    try {
      await this.redisService.client.del(attemptKey, blockKey);
    } catch (err) {
      // Log but don't fail logout/login flow if Redis cannot be cleared
      this.logger.warn(`Redis unavailable in clearLoginAttempts: ${String(err)}`);
      return;
    }
  }

  private async persistRefreshToken(
    user: AuthenticatedUser,
    tokenId: string,
    context: RequestContext
  ) {
    const row: typeof refreshTokens.$inferInsert = {
      id: nanoid(),
      userId: user.id,
      jti: tokenId,
      userAgent: context.userAgent,
      ipAddress: context.ip,
    };

    await this.db.insert(refreshTokens).values(row);
  }

  private async markTokenRevoked(recordId: string) {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, recordId));
  }

  private async issueTokens(user: AuthenticatedUser, context: RequestContext): Promise<Tokens> {
    const tokenId = nanoid();
    const tokens = await this.buildTokens(user, tokenId);
    await this.persistRefreshToken(user, tokenId, context);
    return tokens;
  }

  async login(payload: LoginInput, request?: Request): Promise<Tokens> {
    const email = payload.email.toLowerCase();
    const context = this.extractRequestContext(request);

    await this.ensureNotLocked(email, context.ip);

    const userRecord = await this.usersService.findByEmail(email);
    if (!userRecord) {
      await this.registerFailedAttempt(email, context.ip);
      throw new UnauthorizedException("Invalid credentials");
    }

    const passwordMatches = await verify(userRecord.password, payload.password).catch(() => false);
    if (!passwordMatches) {
      await this.registerFailedAttempt(email, context.ip);
      throw new UnauthorizedException("Invalid credentials");
    }

    await this.clearLoginAttempts(email, context.ip);

    const user = this.mapUser(userRecord);
    return this.issueTokens(user, context);
  }

  async refresh(payload: RefreshInput, request?: Request): Promise<Tokens> {
    let decoded: JwtPayload;
    try {
      decoded = await this.jwtService.verifyAsync<JwtPayload>(payload.refreshToken, {
        secret: this.getConfigString("JWT_REFRESH_SECRET"),
      });
    } catch {
      throw new UnauthorizedException("Refresh token invalid");
    }

    const record = await this.db.query.refreshTokens.findFirst({
      where: and(eq(refreshTokens.userId, decoded.sub), eq(refreshTokens.jti, decoded.tokenId)),
    });

    if (!record || record.revokedAt) {
      throw new UnauthorizedException("Refresh token revoked");
    }

    const userRecord = await this.usersService.findById(decoded.sub);
    if (!userRecord) {
      throw new UnauthorizedException("User not found");
    }

    await this.markTokenRevoked(record.id);

    const user = this.mapUser(userRecord);
    const context = this.extractRequestContext(request);
    return this.issueTokens(user, context);
  }

  async logout(user: RequestUser, payload: LogoutInput) {
    if (payload.all) {
      await this.db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(and(eq(refreshTokens.userId, user.id), isNull(refreshTokens.revokedAt)));
      return { success: true };
    }

    let tokenId = payload.jti ?? null;

    if (!tokenId && payload.refreshToken) {
      try {
        const decoded = await this.jwtService.verifyAsync<JwtPayload>(payload.refreshToken, {
          secret: this.getConfigString("JWT_REFRESH_SECRET"),
        });

        if (decoded.sub !== user.id) {
          throw new UnauthorizedException("Refresh token invalid");
        }

        tokenId = decoded.tokenId;
      } catch {
        throw new UnauthorizedException("Refresh token invalid");
      }
    }

    if (!tokenId) {
      throw new BadRequestException("Missing token identifier");
    }

    const [updated] = await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.userId, user.id), eq(refreshTokens.jti, tokenId)))
      .returning();

    if (!updated) {
      throw new UnauthorizedException("Token not found");
    }

    return { success: true };
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    return this.mapUser(user);
  }

  async register(payload: RegisterUserInput, request?: Request) {
    const existing = await this.usersService.findByEmail(payload.email);
    if (existing) {
      throw new UnauthorizedException("Email already registered");
    }

    const created = await this.usersService.create(payload);
    const user = this.mapUser(created);
    const context = this.extractRequestContext(request);
    return this.issueTokens(user, context);
  }
}
