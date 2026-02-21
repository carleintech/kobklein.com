import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { SupabaseGuard } from "../auth/supabase.guard";
import { FreezeGuard } from "../security/freeze.guard";
import { withIdempotency } from "../idempotency/idempotency.service";
import { executeFxTransfer } from "../transfers/fx-transfer.service";
import { getActiveFxRate } from "../fx/fx.service";

@Controller("v1/diaspora")
export class DiasporaSendController {
  /**
   * Send USD -> HTG to a linked family member.
   * Uses the FX transfer wrapper (keeps executeTransfer untouched).
   *
   * Flow:
   *   1. Validate family link
   *   2. Get FX rate preview
   *   3. Execute cross-currency transfer
   *   4. Return receipt with FX details
   */
  @UseGuards(SupabaseGuard, FreezeGuard)
  @Post("send")
  async sendToFamily(
    @Req() req: any,
    @Body()
    body: {
      familyLinkId: string;
      amountUsd: number;
      idempotencyKey: string;
    },
  ) {
    const diasporaUserId = req.localUser?.id || req.user?.sub;

    if (!body.amountUsd || body.amountUsd <= 0) {
      throw new Error("Amount must be positive");
    }

    // Validate family link belongs to this diaspora user
    const link = await prisma.familyLink.findFirst({
      where: { id: body.familyLinkId, diasporaUserId },
      include: {
        familyUser: {
          select: { id: true, firstName: true, handle: true },
        },
      },
    });

    if (!link) throw new Error("Family link not found");

    // Execute with idempotency
    const result = await withIdempotency({
      userId: diasporaUserId,
      route: "POST:/v1/diaspora/send",
      key: body.idempotencyKey,
      body,
      run: async () => {
        const transfer = await executeFxTransfer({
          senderUserId: diasporaUserId,
          recipientUserId: link.familyUserId,
          amountUsd: body.amountUsd,
          idempotencyKey: body.idempotencyKey,
        });

        return {
          ok: true,
          transferId: transfer.transferId,
          fxRate: transfer.fxRate,
          sentUsd: transfer.sentUsd,
          receivedHtg: transfer.receivedHtg,
          recipientName:
            link.nickname ||
            link.familyUser.firstName ||
            link.familyUser.handle,
        };
      },
    });

    return result;
  }

  /**
   * Preview FX conversion before sending.
   * Shows the user exactly how much HTG their USD will become.
   */
  @UseGuards(SupabaseGuard)
  @Post("send/preview")
  async previewSend(
    @Req() req: any,
    @Body() body: { amountUsd: number },
  ) {
    if (!body.amountUsd || body.amountUsd <= 0) {
      throw new Error("Amount must be positive");
    }

    const rate = await getActiveFxRate("USD", "HTG");
    const amountHtg = Math.round(body.amountUsd * rate * 100) / 100;

    return {
      amountUsd: body.amountUsd,
      fxRate: rate,
      amountHtg,
      // Future: add fee breakdown here
    };
  }
}
