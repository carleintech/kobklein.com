import { Injectable, NestMiddleware } from "@nestjs/common";
import { type Lang } from "../i18n/templates";
import { toLang } from "../i18n/render";

/**
 * Language Detection Middleware (Phase 48)
 *
 * Detects the user's preferred language from:
 *   1. ?lang= query parameter (highest priority)
 *   2. Accept-Language header
 *   3. Defaults to "en"
 *
 * Sets req.lang (Lang) for downstream controllers.
 *
 * Note: User.preferredLang is used where the user is already loaded
 * (e.g. in notification schedulers). This middleware handles the HTTP layer.
 */
@Injectable()
export class LanguageMiddleware implements NestMiddleware {
  use(req: any, _res: any, next: () => void) {
    // 1. Query parameter takes priority
    const queryLang = req.query?.lang;
    if (queryLang) {
      req.lang = toLang(queryLang);
      return next();
    }

    // 2. Accept-Language header
    const acceptLang = req.headers?.["accept-language"];
    if (acceptLang) {
      // Parse first language tag: "fr-HT,fr;q=0.9,en" → "fr"
      const primary = acceptLang.split(",")[0]?.split("-")[0]?.trim();
      req.lang = toLang(primary);
      return next();
    }

    // 3. Default
    req.lang = "en" as Lang;
    next();
  }
}
