/**
 * Consolidated API client.
 *
 * All HTTP helpers live in kobklein-api.ts.  This module re-exports them
 * so that existing `import { apiGet } from "@/lib/api"` calls keep working.
 */
export {
  kkGet as apiGet,
  kkPost as apiPost,
  kkGet,
  kkPost,
  kkPatch,
  kkDelete,
} from "./kobklein-api";
