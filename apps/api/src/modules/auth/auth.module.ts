import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { UsersModule } from "../users/users.module";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./strategies/jwt.strategy";
import type { EnvironmentVariables } from "../../config/env.validation";

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvironmentVariables>) => {
        const secret =
          configService?.get("JWT_ACCESS_SECRET", { infer: true }) ??
          process.env.JWT_ACCESS_SECRET ??
          "";
        const configTtl = configService?.get("JWT_ACCESS_TTL", { infer: true });
        const envTtlRaw = process.env.JWT_ACCESS_TTL;
        const envTtl = envTtlRaw ? Number(envTtlRaw) : NaN;
        const ttl =
          typeof configTtl === "number" && Number.isFinite(configTtl)
            ? configTtl
            : Number.isFinite(envTtl)
              ? envTtl
              : 900;

        return {
          secret,
          signOptions: {
            expiresIn: ttl,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
