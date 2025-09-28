import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { verify, hash } from "argon2";
import { nanoid } from "nanoid";
import { addSeconds } from "date-fns";
import type { LoginInput, RefreshInput, RegisterUserInput } from "@shared/schemas";
import type { Role } from "@shared/constants";
import { UsersService } from "../users/users.service";
import type { AuthenticatedUser } from "../../common/types/authenticated-user";
import { RedisService } from "../../infrastructure/redis/redis.service";
import { DRIZZLE_CLIENT } from "../../infrastructure/database/database.constants";
import type { Database } from "../../db/client";
import { refreshTokens, users } from "../../db/schema";
import type { EnvironmentVariables } from "../../config/env.validation";
import type { JwtPayload, Tokens } from "./auth.types";
import { eq } from "drizzle-orm";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<EnvironmentVariables>,
    private readonly redisService: RedisService,
    @Inject(DRIZZLE_CLIENT) private readonly db: Database
  ) {}

  private get accessTtl() {
    return this.configService.get("JWT_ACCESS_TTL", { infer: true }) ?? 900;
  }

  private get refreshTtl() {
    return this.configService.get("JWT_REFRESH_TTL", { infer: true }) ?? 2592000;
  }

  private async buildTokens(user: AuthenticatedUser, tokenId: string): Promise<Tokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      teacherId: user.teacherId,
      studentId: user.studentId,
      tokenId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get("JWT_ACCESS_SECRET", { infer: true }),
        expiresIn: this.accessTtl,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get("JWT_REFRESH_SECRET", { infer: true }),
        expiresIn: this.refreshTtl,
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

  private async persistRefreshToken(
    user: AuthenticatedUser,
    tokenId: string,
    refreshToken: string
  ) {
    const hashed = await hash(refreshToken);
    const expiresAt = addSeconds(new Date(), this.refreshTtl);

    await this.db
      .insert(refreshTokens)
      .values({
        id: tokenId,
        userId: user.id,
        tokenHash: hashed,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: refreshTokens.id,
        set: { tokenHash: hashed, expiresAt },
      });

    await this.redisService.client.set(
      this.refreshCacheKey(user.id, tokenId),
      hashed,
      "EX",
      this.refreshTtl
    );
  }

  private refreshCacheKey(userId: string, tokenId: string) {
    return `refresh:${userId}:${tokenId}`;
  }

  private mapUser(user: typeof users.$inferSelect): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role as Role,
      teacherId: user.teacherId,
      studentId: user.studentId,
    };
  }

  async validateUser(email: string, plainPassword: string): Promise<AuthenticatedUser> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const passwordMatches = await verify(user.password, plainPassword);
    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return this.mapUser(user);
  }

  async login(payload: LoginInput): Promise<Tokens> {
    const user = await this.validateUser(payload.email, payload.password);
    const tokenId = nanoid();
    const tokens = await this.buildTokens(user, tokenId);
    await this.persistRefreshToken(user, tokenId, tokens.refreshToken);
    return tokens;
  }

  async refresh(payload: RefreshInput): Promise<Tokens> {
    const decoded = await this.jwtService.verifyAsync<JwtPayload>(payload.refreshToken, {
      secret: this.configService.get("JWT_REFRESH_SECRET", { infer: true }),
    });

    const cacheKey = this.refreshCacheKey(decoded.sub, decoded.tokenId);
    const cachedHash = await this.redisService.client.get(cacheKey);

    if (!cachedHash) {
      throw new UnauthorizedException("Refresh token revoked");
    }

    const record = await this.db.query.refreshTokens.findFirst({
      where: eq(refreshTokens.id, decoded.tokenId),
    });

    if (!record) {
      throw new UnauthorizedException("Refresh token not found");
    }

    const matches = await verify(record.tokenHash, payload.refreshToken).catch(() => false);

    if (!matches) {
      await this.redisService.client.del(cacheKey);
      await this.db.delete(refreshTokens).where(eq(refreshTokens.id, decoded.tokenId));
      throw new UnauthorizedException("Refresh token invalid");
    }

    const userRecord = await this.usersService.findById(decoded.sub);
    if (!userRecord) {
      throw new UnauthorizedException("User not found");
    }

    await Promise.all([
      this.redisService.client.del(cacheKey),
      this.db.delete(refreshTokens).where(eq(refreshTokens.id, decoded.tokenId)),
    ]);

    const user = this.mapUser(userRecord);
    const newTokenId = nanoid();
    const tokens = await this.buildTokens(user, newTokenId);
    await this.persistRefreshToken(user, newTokenId, tokens.refreshToken);
    return tokens;
  }

  async logout(payload: RefreshInput) {
    const decoded = await this.jwtService.verifyAsync<JwtPayload>(payload.refreshToken, {
      secret: this.configService.get("JWT_REFRESH_SECRET", { infer: true }),
    });

    await Promise.all([
      this.redisService.client.del(this.refreshCacheKey(decoded.sub, decoded.tokenId)),
      this.db.delete(refreshTokens).where(eq(refreshTokens.id, decoded.tokenId)),
    ]);

    return { success: true };
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    return this.mapUser(user);
  }

  async register(payload: RegisterUserInput) {
    const existing = await this.usersService.findByEmail(payload.email);
    if (existing) {
      throw new UnauthorizedException("Email already registered");
    }

    await this.usersService.create(payload);
    return this.login({ email: payload.email, password: payload.password });
  }
}
