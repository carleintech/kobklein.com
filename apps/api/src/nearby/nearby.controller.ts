/**
 * Nearby Search Controller — KobKlein API
 *
 * GET /v1/nearby/merchants    — merchants within radius meters
 * GET /v1/nearby/distributors — distributors within radius meters
 *
 * Query params:
 *   lat    — latitude (required)
 *   lng    — longitude (required)
 *   radius — search radius in meters (default 5000, max 20000)
 */
import {
  Controller,
  Get,
  Query,
  HttpException,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { prisma } from "../db/prisma";

type NearbyRow = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distance_m: number;
  phone: string | null;
  k_id: string | null;
  category: string | null;
  type: "merchant" | "distributor";
};

@Controller("v1/nearby")
@UseGuards(SupabaseGuard)
export class NearbyController {
  @Get("merchants")
  async merchants(
    @Query("lat") latStr: string,
    @Query("lng") lngStr: string,
    @Query("radius") radiusStr = "5000",
  ) {
    const { lat, lng, radius } = parseCoords(latStr, lngStr, radiusStr);

    const rows = await prisma.$queryRaw<NearbyRow[]>`
      SELECT
        sub.id,
        sub.name,
        sub.lat,
        sub.lng,
        sub.distance_m,
        sub.phone,
        sub.k_id,
        sub.category,
        'merchant' AS type
      FROM (
        SELECT
          m.id,
          m."businessName" AS name,
          m.lat,
          m.lng,
          u.phone,
          u."kId" AS k_id,
          m.category,
          (6371000 * acos(
            LEAST(1.0, cos(radians(${lat})) * cos(radians(m.lat))
            * cos(radians(m.lng) - radians(${lng}))
            + sin(radians(${lat})) * sin(radians(m.lat)))
          )) AS distance_m
        FROM "Merchant" m
        JOIN "User" u ON u.id = m."userId"
        WHERE m.lat IS NOT NULL AND m.lng IS NOT NULL AND m.status = 'approved'
      ) sub
      WHERE sub.distance_m <= ${radius}
      ORDER BY sub.distance_m ASC
      LIMIT 30
    `;

    return rows.map(formatRow);
  }

  @Get("distributors")
  async distributors(
    @Query("lat") latStr: string,
    @Query("lng") lngStr: string,
    @Query("radius") radiusStr = "5000",
  ) {
    const { lat, lng, radius } = parseCoords(latStr, lngStr, radiusStr);

    const rows = await prisma.$queryRaw<NearbyRow[]>`
      SELECT
        sub.id,
        sub.name,
        sub.lat,
        sub.lng,
        sub.distance_m,
        sub.phone,
        sub.k_id,
        NULL AS category,
        'distributor' AS type
      FROM (
        SELECT
          d.id,
          COALESCE(d."displayName", d."businessName", u."firstName") AS name,
          d.lat,
          d.lng,
          COALESCE(d."phonePublic", u.phone) AS phone,
          u."kId" AS k_id,
          (6371000 * acos(
            LEAST(1.0, cos(radians(${lat})) * cos(radians(d.lat))
            * cos(radians(d.lng) - radians(${lng}))
            + sin(radians(${lat})) * sin(radians(d.lat)))
          )) AS distance_m
        FROM "Distributor" d
        JOIN "User" u ON u.id = d."userId"
        WHERE d.lat IS NOT NULL AND d.lng IS NOT NULL AND d.status = 'approved'
      ) sub
      WHERE sub.distance_m <= ${radius}
      ORDER BY sub.distance_m ASC
      LIMIT 30
    `;

    return rows.map(formatRow);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────

function parseCoords(latStr: string, lngStr: string, radiusStr: string) {
  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);
  const radius = Math.min(20000, Math.max(100, parseFloat(radiusStr) || 5000));

  if (isNaN(lat) || isNaN(lng)) {
    throw new HttpException("lat and lng query params are required", HttpStatus.BAD_REQUEST);
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new HttpException("lat/lng out of range", HttpStatus.BAD_REQUEST);
  }

  return { lat, lng, radius };
}

function formatRow(row: NearbyRow) {
  return {
    id: row.id,
    name: row.name,
    lat: Number(row.lat),
    lng: Number(row.lng),
    distanceM: Math.round(Number(row.distance_m)),
    phone: row.phone ?? null,
    kId: row.k_id ?? null,
    category: row.category ?? null,
    type: row.type,
  };
}
