import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { Auth0Guard } from "../auth/auth0.guard";

@Controller("me")
export class UsersController {
  @UseGuards(Auth0Guard)
  @Get()
  me(@Req() req: any) {
    return {
      auth0: req.user,
      local: req.localUser,
    };
  }
}
