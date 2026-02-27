import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { SupabaseGuard } from "../auth/supabase.guard";
import { PlaidService } from "./plaid.service";

class ExchangeTokenDto {
  publicToken!: string;
  institutionName?: string;
}

class AchTopupDto {
  plaidAccountId!: string;
  amountUsd!: number;
}

/**
 * Plaid Bank Linking endpoints — Diaspora users only.
 *
 * Flow:
 * 1. POST /link-token    → get linkToken (use in react-plaid-link)
 * 2. POST /exchange      → exchange publicToken → linked account stored in DB
 * 3. GET  /accounts      → list linked accounts
 * 4. POST /topup         → initiate ACH top-up from linked account
 * 5. DELETE /accounts/:id → unlink account
 */
@Controller("v1/diaspora/plaid")
@UseGuards(SupabaseGuard)
export class PlaidController {
  constructor(private readonly plaid: PlaidService) {}

  /**
   * POST /v1/diaspora/plaid/link-token
   * Creates a Plaid Link token for the user to initialize the Plaid Link flow.
   */
  @Post("link-token")
  async createLinkToken(@Req() req: any) {
    const userId = req.localUser?.id || req.user?.sub;
    const email = req.localUser?.email ?? undefined;
    return this.plaid.createLinkToken(userId, email);
  }

  /**
   * POST /v1/diaspora/plaid/exchange
   * Exchanges the public_token from Plaid Link for a stored, encrypted access_token.
   * Body: { publicToken: string, institutionName?: string }
   */
  @Post("exchange")
  async exchange(@Req() req: any, @Body() body: ExchangeTokenDto) {
    const userId = req.localUser?.id || req.user?.sub;
    if (!body.publicToken) {
      throw new Error("publicToken is required");
    }
    return this.plaid.exchangePublicToken(userId, body.publicToken, body.institutionName);
  }

  /**
   * GET /v1/diaspora/plaid/accounts
   * Returns all active linked bank accounts for the current diaspora user.
   */
  @Get("accounts")
  async accounts(@Req() req: any) {
    const userId = req.localUser?.id || req.user?.sub;
    return this.plaid.getLinkedAccounts(userId);
  }

  /**
   * POST /v1/diaspora/plaid/topup
   * Initiates an ACH bank transfer to top up the diaspora USD wallet.
   * Body: { plaidAccountId: string, amountUsd: number }
   */
  @Post("topup")
  async topup(@Req() req: any, @Body() body: AchTopupDto) {
    const userId = req.localUser?.id || req.user?.sub;
    if (!body.plaidAccountId || !body.amountUsd) {
      throw new Error("plaidAccountId and amountUsd are required");
    }
    return this.plaid.initiateAchTopup(userId, body.plaidAccountId, body.amountUsd);
  }

  /**
   * DELETE /v1/diaspora/plaid/accounts/:id
   * Unlinks (deactivates) a Plaid bank account.
   */
  @Delete("accounts/:id")
  async unlink(@Req() req: any, @Param("id") accountId: string) {
    const userId = req.localUser?.id || req.user?.sub;
    return this.plaid.unlinkAccount(userId, accountId);
  }
}
