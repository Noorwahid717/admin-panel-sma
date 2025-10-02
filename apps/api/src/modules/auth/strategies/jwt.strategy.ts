import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { EnvironmentVariables } from "../../../config/env.validation";
import type { AuthenticatedUser, JwtPayload } from "@api/auth/auth.types";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService<EnvironmentVariables>) {
    const secret =
      configService?.get("JWT_ACCESS_SECRET", { infer: true }) ?? process.env.JWT_ACCESS_SECRET;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    return {
      id: payload.sub,
      email: payload.email,
      fullName: payload.fullName,
      role: payload.role,
      teacherId: payload.teacherId,
      studentId: payload.studentId,
    };
  }
}
