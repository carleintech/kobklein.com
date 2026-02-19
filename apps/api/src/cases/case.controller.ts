import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { Roles } from "../policies/roles.decorator";
import { RolesGuard } from "../policies/roles.guard";
import {
  createCase,
  listCases,
  getCaseDetail,
  updateCaseStatus,
  assignCase,
  addCaseNote,
} from "./case.service";

@Controller("admin/cases")
export class CaseController {
  // ── Create a new case ──────────────────────────────────────────────
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Post()
  async create(@Req() req: any, @Body() body: any) {
    return createCase({
      type: body.caseType, // updated field name
      userId: body.reporterUserId, // updated field name
      relatedType: body.referenceType, // updated field name
      relatedId: body.referenceId, // updated field name
      description: body.description,
      priority: body.priority,
      assignedTo: body.assignedTo,
      createdByAdminId: req.localUser.id,
    });
  }

  // ── List cases (with optional filters) ─────────────────────────────
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Get()
  async list(
    @Query("status") status?: string,
    @Query("caseType") caseType?: string, // updated param name
    @Query("priority") priority?: string,
    @Query("reporterUserId") reporterUserId?: string, // updated param name
    @Query("limit") limit?: string,
  ) {
    return listCases({
      status,
      type: caseType, // map to old param name for service
      priority,
      userId: reporterUserId, // map to old param name for service
      limit: limit ? Number(limit) : undefined,
    });
  }

  // ── Get single case with notes ─────────────────────────────────────
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Get(":id")
  async detail(@Param("id") id: string) {
    return getCaseDetail(id);
  }

  // ── Update case status ─────────────────────────────────────────────
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Patch(":id/status")
  async updateStatus(@Req() req: any, @Param("id") id: string, @Body() body: any) {
    return updateCaseStatus({
      caseId: id,
      status: body.status,
      adminUserId: req.localUser.id,
    });
  }

  // ── Assign case to investigator ────────────────────────────────────
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Patch(":id/assign")
  async assign(@Req() req: any, @Param("id") id: string, @Body() body: any) {
    return assignCase({
      caseId: id,
      assignedTo: body.assignedTo,
      adminUserId: req.localUser.id,
    });
  }

  // ── Add note to case ───────────────────────────────────────────────
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Post(":id/notes")
  async note(@Req() req: any, @Param("id") id: string, @Body() body: any) {
    return addCaseNote(id, req.localUser.id, body.note);
  }

  // ── Case Actions ───────────────────────────────────────────────────
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Post(":id/actions/freeze")
  async freezeAccount(@Req() req: any, @Param("id") id: string) {
    // Implementation needed - freeze the user account
    return { message: "Freeze action recorded" };
  }

  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Post(":id/actions/request-info")
  async requestInfo(@Req() req: any, @Param("id") id: string, @Body() body: any) {
    // Implementation needed - record request info action
    return { message: "Info request recorded" };
  }

  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Post(":id/actions/resolve")
  async resolveCase(@Req() req: any, @Param("id") id: string, @Body() body: any) {
    return updateCaseStatus({
      caseId: id,
      status: "resolved",
      adminUserId: req.localUser.id,
    });
  }

  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Post(":id/actions/reject")
  async rejectCase(@Req() req: any, @Param("id") id: string, @Body() body: any) {
    return updateCaseStatus({
      caseId: id,
      status: "rejected",
      adminUserId: req.localUser.id,
    });
  }
}
