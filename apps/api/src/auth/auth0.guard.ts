import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { syncUserFromAuth0 } from "./auth-sync.service";
import { registerDeviceSession } from "../security/device.service";

function getBearerToken(req: any): string | null {
  const h = req.headers?.authorization;
  if (!h) return null;
  const [type, token] = h.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token;
}

@Injectable()
export class Auth0Guard implements CanActivate {
  private jwks: ReturnType<typeof createRemoteJWKSet>;
  private issuer: string;
  private audience: string;

  constructor(private readonly config: ConfigService) {
    const domain = this.config.get<string>("AUTH0_DOMAIN");
    if (!domain) throw new Error("AUTH0_DOMAIN missing");

    this.issuer = this.config.get<string>("AUTH0_ISSUER") ?? `https://${domain}/`;
    this.audience = this.config.get<string>("AUTH0_AUDIENCE") ?? "";

    const jwksUrl = new URL(`https://${domain}/.well-known/jwks.json`);
    this.jwks = createRemoteJWKSet(jwksUrl);
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const token = getBearerToken(req);

    if (!token) throw new UnauthorizedException("Missing Bearer token");

    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.issuer,
        audience: this.audience,
      });

      // Attach user identity to request for controllers/services
      req.user = payload;
      
      // Sync user from Auth0 to local database
      const localUser = await syncUserFromAuth0(payload);
      req.localUser = localUser;
      
      // Register device session for security monitoring
      const deviceResult = await registerDeviceSession(localUser.id, req);
      req.security = {
        isNewDevice: deviceResult.isNew,
      };
      
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}
