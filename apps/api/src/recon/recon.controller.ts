import { Controller, Post, UseGuards } from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { Roles } from "../policies/roles.decorator";
import { RolesGuard } from "../policies/roles.guard";
import { runReconciliation } from "./recon.service";

@Controller("admin/recon")
export class ReconController {
  @UseGuards(SupabaseGuard, RolesGuard)
  @Roles("admin")
  @Post("run")
  async run() {
    return runReconciliation();
  }
}
