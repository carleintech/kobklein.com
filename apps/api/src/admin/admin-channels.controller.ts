/**
 * ─── KobKlein API — Internal Channel Controller ──────────────────────────────
 * Route prefix: /v1/admin/channels
 *
 * Military-style clearance model:
 *   Level 1 — GLOBAL    : all admin staff
 *   Level 2 — OPS       : super_admin, admin, regional_manager, treasury_officer, broadcaster
 *   Level 3 — SECURE    : super_admin, compliance_officer
 *   Level 4 — EXEC      : super_admin only
 *   REGIONAL            : super_admin + admin (all regions); regional_manager (own region)
 *
 * Security guarantees:
 *  - Every read attempt (allowed or denied) is audit-logged
 *  - Denied access returns clearance requirement info (not channel content)
 *  - No role can delete messages or read logs (immutable)
 *  - Regional manager region scoping enforced via JWT metadata.region
 */

import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { SupabaseGuard } from "../auth/supabase.guard";
import { RolesGuard } from "../policies/roles.guard";
import { Roles } from "../policies/roles.decorator";
import { AuditService } from "../audit/audit.service";

// ─── Clearance tables (mirrors frontend ROLE_CLEARANCE) ──────────────────────

const ROLE_CLEARANCE: Record<string, number> = {
  super_admin:        4,
  admin:              2,
  regional_manager:   2,
  treasury_officer:   2,
  compliance_officer: 3,
  hr_manager:         1,
  support_agent:      1,
  auditor:            1,
  broadcaster:        2,
  investor:           0,
};

/** Minimum clearance required to READ each channel */
const READ_CLEARANCE: Record<string, number> = {
  global:                1,
  ops:                   2,
  compliance:            3,
  executive:             4,
  "regional-ouest":      2,
  "regional-nord":       2,
  "regional-sud":        2,
  "regional-artibonite": 2,
};

/** Minimum clearance required to POST in each channel */
const POST_CLEARANCE: Record<string, number> = {
  global:                1,
  ops:                   2,
  compliance:            3,
  executive:             4,
  "regional-ouest":      2,
  "regional-nord":       2,
  "regional-sud":        2,
  "regional-artibonite": 2,
};

const REGIONAL_CHANNELS = new Set([
  "regional-ouest",
  "regional-nord",
  "regional-sud",
  "regional-artibonite",
]);

const ALL_CHANNELS = Object.keys(READ_CLEARANCE);

// ─── In-memory stores (replace with Prisma tables in production) ──────────────

type StoredMessage = {
  id: string;
  content: string;
  authorId: string;
  authorRole: string;
  tag: string;
  createdAt: string;
};

type ReadEvent = {
  channelId: string;
  userId: string;
  role: string;
  allowed: boolean;
  at: string;
};

const MESSAGE_STORE: Record<string, StoredMessage[]> = {};
const READ_LOG: ReadEvent[] = [];

for (const ch of ALL_CHANNELS) {
  MESSAGE_STORE[ch] = [];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAdminRole(req: Request): string {
  const meta = (req as unknown as { user: { user_metadata?: Record<string, unknown> } })
    .user?.user_metadata as Record<string, unknown> | undefined;
  return (
    (meta?.["admin_role"] as string | undefined) ??
    (meta?.["role"] as string | undefined) ??
    "support_agent"
  );
}

function getRegionId(req: Request): string | undefined {
  const meta = (req as unknown as { user: { user_metadata?: Record<string, unknown> } })
    .user?.user_metadata as Record<string, unknown> | undefined;
  return meta?.["region"] as string | undefined;
}

function getUserId(req: Request): string {
  return (req as unknown as { user: { sub: string } }).user?.sub ?? "unknown";
}

function canRead(role: string, channelId: string, regionId?: string): boolean {
  const clearance = ROLE_CLEARANCE[role] ?? 0;
  if (clearance === 0) return false;

  if (REGIONAL_CHANNELS.has(channelId)) {
    if (role === "super_admin" || role === "admin") return true;
    if (role === "regional_manager") {
      return channelId === `regional-${regionId}`;
    }
    return false;
  }

  return clearance >= (READ_CLEARANCE[channelId] ?? 99);
}

function canPost(role: string, channelId: string, regionId?: string): boolean {
  if (role === "auditor" || role === "investor") return false;

  if (REGIONAL_CHANNELS.has(channelId)) {
    if (role === "super_admin" || role === "admin") return true;
    if (role === "regional_manager") return channelId === `regional-${regionId}`;
    return false;
  }

  const clearance = ROLE_CLEARANCE[role] ?? 0;
  return clearance >= (POST_CLEARANCE[channelId] ?? 99);
}

// ─── Controller ───────────────────────────────────────────────────────────────

@UseGuards(SupabaseGuard, RolesGuard)
@Roles(
  "super_admin",
  "admin",
  "regional_manager",
  "support_agent",
  "compliance_officer",
  "treasury_officer",
  "hr_manager",
  "auditor",
  "broadcaster",
)
@Controller("v1/admin/channels")
export class AdminChannelsController {
  constructor(private readonly audit: AuditService) {}

  // ── List all channels with access status for current role ──────────────────
  @Get()
  listChannels(@Req() req: Request) {
    const role     = getAdminRole(req);
    const regionId = getRegionId(req);
    const clearance = ROLE_CLEARANCE[role] ?? 0;

    return ALL_CHANNELS.map((id) => ({
      id,
      clearanceRequired: READ_CLEARANCE[id],
      userClearance:     clearance,
      canRead:  canRead(role, id, regionId),
      canPost:  canPost(role, id, regionId),
      isRegional: REGIONAL_CHANNELS.has(id),
      messageCount: MESSAGE_STORE[id]?.length ?? 0,
    }));
  }

  // ── Get messages for a specific channel ────────────────────────────────────
  @Get(":channelId/messages")
  async getMessages(
    @Req() req: Request,
    @Param("channelId") channelId: string,
  ) {
    const role     = getAdminRole(req);
    const regionId = getRegionId(req);
    const userId   = getUserId(req);

    if (!READ_CLEARANCE[channelId]) {
      throw new NotFoundException(`Channel '${channelId}' does not exist`);
    }

    const allowed = canRead(role, channelId, regionId);

    // Log every read attempt — allowed or denied
    READ_LOG.push({ channelId, userId, role, allowed, at: new Date().toISOString() });

    if (!allowed) {
      // Audit the denied access attempt
      await this.audit.logFinancialAction({
        actorUserId: userId,
        eventType:   "channel.access_denied",
        referenceId: channelId,
        meta: {
          role,
          channelId,
          clearanceRequired: READ_CLEARANCE[channelId],
          userClearance:     ROLE_CLEARANCE[role] ?? 0,
        },
      });

      throw new ForbiddenException({
        code:              "CLEARANCE_INSUFFICIENT",
        channel:           channelId,
        requiredClearance: READ_CLEARANCE[channelId],
        yourClearance:     ROLE_CLEARANCE[role] ?? 0,
        message: `Access to channel '${channelId}' requires clearance level ${READ_CLEARANCE[channelId]}. Your clearance: ${ROLE_CLEARANCE[role] ?? 0}`,
      });
    }

    // Audit successful read
    await this.audit.logFinancialAction({
      actorUserId: userId,
      eventType:   "channel.messages_read",
      referenceId: channelId,
      meta:        { role, channelId },
    });

    return {
      channelId,
      messages:   MESSAGE_STORE[channelId] ?? [],
      totalCount: MESSAGE_STORE[channelId]?.length ?? 0,
    };
  }

  // ── Post a message to a channel ────────────────────────────────────────────
  @Post(":channelId/messages")
  async postMessage(
    @Req() req: Request,
    @Param("channelId") channelId: string,
    @Body() body: { content: string; tag?: string },
  ) {
    const role     = getAdminRole(req);
    const regionId = getRegionId(req);
    const userId   = getUserId(req);

    if (!READ_CLEARANCE[channelId]) {
      throw new NotFoundException(`Channel '${channelId}' does not exist`);
    }

    if (!canPost(role, channelId, regionId)) {
      throw new ForbiddenException({
        code:    "POST_CLEARANCE_INSUFFICIENT",
        message: `Your role (${role}) cannot post to channel '${channelId}'`,
      });
    }

    if (!body.content?.trim()) {
      throw new ForbiddenException("Message content cannot be empty");
    }

    const msg: StoredMessage = {
      id:         `msg-${Date.now()}`,
      content:    body.content.trim(),
      authorId:   userId,
      authorRole: role,
      tag:        body.tag ?? "INFO",
      createdAt:  new Date().toISOString(),
    };

    MESSAGE_STORE[channelId] = MESSAGE_STORE[channelId] ?? [];
    MESSAGE_STORE[channelId].push(msg);

    await this.audit.logFinancialAction({
      actorUserId: userId,
      eventType:   "channel.message_posted",
      referenceId: channelId,
      meta:        { role, channelId, messageId: msg.id, tag: msg.tag },
    });

    return { success: true, message: msg };
  }

  // ── Read log — who viewed what (super_admin only) ─────────────────────────
  @Get(":channelId/read-log")
  @Roles("super_admin")
  getReadLog(@Param("channelId") channelId: string) {
    const log = READ_LOG.filter((e) => e.channelId === channelId);
    return {
      channelId,
      total:   log.length,
      allowed: log.filter((e) =>  e.allowed).length,
      denied:  log.filter((e) => !e.allowed).length,
      log,
    };
  }

  // ── Global read log — all channels (super_admin only) ─────────────────────
  @Get("logs/all")
  @Roles("super_admin")
  getAllLogs() {
    return {
      total:   READ_LOG.length,
      allowed: READ_LOG.filter((e) =>  e.allowed).length,
      denied:  READ_LOG.filter((e) => !e.allowed).length,
      log:     READ_LOG,
    };
  }
}
