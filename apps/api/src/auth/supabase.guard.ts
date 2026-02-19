import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { syncUserFromSupabase, syncUserFromAuth0 } from "./auth-sync.service";
import { registerDeviceSession } from "../security/device.service";

function getBearerToken(req: any): string | null {
  const h = req.headers?.authorization;
  if (!h) return null;
  const [type, token] = h.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token;
}

/**
 * Dual-auth guard: tries Supabase JWT (ES256 via JWKS) first,
 * then falls back to Auth0 JWT (RS256 via JWKS) for admin.
 *
 * Both paths set req.user, req.localUser, and req.security
 * so all controllers work identically regardless of token source.
 */
@Injectable()
export class SupabaseGuard implements CanActivate {
  private readonly logger = new Logger('SupabaseGuard');
  private supabaseJwks: ReturnType<typeof createRemoteJWKSet> | null = null;
  private supabaseIssuer: string = "";
  private auth0Jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
  private auth0Issuer: string = "";
  private auth0Audience: string = "";

  constructor(private readonly config: ConfigService) {
    // Supabase JWT verification (ES256 via JWKS)
    const supabaseUrl = this.config.get<string>("SUPABASE_URL");
    if (supabaseUrl) {
      const jwksUrl = new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`);
      this.supabaseJwks = createRemoteJWKSet(jwksUrl);
      this.supabaseIssuer = `${supabaseUrl}/auth/v1`;
    }

    // Auth0 fallback (RS256 via JWKS) — for admin app
    const auth0Domain = this.config.get<string>("AUTH0_DOMAIN");
    if (auth0Domain) {
      this.auth0Issuer =
        this.config.get<string>("AUTH0_ISSUER") ?? `https://${auth0Domain}/`;
      this.auth0Audience = this.config.get<string>("AUTH0_AUDIENCE") ?? "";
      const jwksUrl = new URL(`https://${auth0Domain}/.well-known/jwks.json`);
      this.auth0Jwks = createRemoteJWKSet(jwksUrl);
    }

    if (!this.supabaseJwks && !this.auth0Jwks) {
      throw new Error(
        "Neither SUPABASE_URL nor AUTH0_DOMAIN is configured. At least one auth provider is required.",
      );
    }
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const token = getBearerToken(req);

    if (!token) {
      this.logger.warn('Missing Bearer token');
      throw new UnauthorizedException("Missing Bearer token");
    }

    this.logger.debug(`Incoming JWT: ${token}`);

    // ── Try 1: Supabase JWT (ES256 via JWKS) ──
    if (this.supabaseJwks) {
      try {
        const { payload } = await jwtVerify(token, this.supabaseJwks, {
          issuer: this.supabaseIssuer,
          // Note: Supabase JWTs don't include 'aud' claim by default, so no audience check
        });
        this.logger.debug(`Supabase JWT payload: ${JSON.stringify(payload)}`);

        req.user = payload;

        const localUser = await syncUserFromSupabase(payload);
        req.localUser = localUser;

        const deviceResult = await registerDeviceSession(localUser.id, req);
        req.security = { isNewDevice: deviceResult.isNew };

        this.logger.debug(`Supabase user attached: ${JSON.stringify(localUser)}`);
        return true;
      } catch (err) {
        this.logger.warn(`Supabase JWT validation failed: ${err?.message || err}`);
        // Not a valid Supabase token — try Auth0 fallback
      }
    }

    // ── Try 2: Auth0 JWT (RS256 via JWKS) — for admin ──
    if (this.auth0Jwks) {
      try {
        const { payload } = await jwtVerify(token, this.auth0Jwks, {
          issuer: this.auth0Issuer,
          audience: this.auth0Audience,
        });
        this.logger.debug(`Auth0 JWT payload: ${JSON.stringify(payload)}`);

        req.user = payload;

        const localUser = await syncUserFromAuth0(payload);
        req.localUser = localUser;

        const deviceResult = await registerDeviceSession(localUser.id, req);
        req.security = { isNewDevice: deviceResult.isNew };

        this.logger.debug(`Auth0 user attached: ${JSON.stringify(localUser)}`);
        return true;
      } catch (err) {
        this.logger.warn(`Auth0 JWT validation failed: ${err?.message || err}`);
        // Neither token type valid
      }
    }

    this.logger.error('Invalid or expired token');
    throw new UnauthorizedException("Invalid or expired token");
  }
}
