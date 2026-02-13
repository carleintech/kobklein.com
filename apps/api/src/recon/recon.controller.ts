import { Controller, Post, UseGuards } from "@nestjs/common";
import { Auth0Guard } from "../auth/auth0.guard";
import { Roles } from "../policies/roles.decorator";
import { RolesGuard } from "../policies/roles.guard";
import { runReconciliation } from "./recon.service";

@Controller("admin/recon")
export class ReconController {
  @UseGuards(Auth0Guard, RolesGuard)
  @Roles("admin")
  @Post("run")
  async run() {
    return runReconciliation();
  }
}
