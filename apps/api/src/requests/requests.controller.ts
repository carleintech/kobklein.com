import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { prisma } from "../db/prisma";
import { Auth0Guard } from "../auth/auth0.guard";
import { FreezeGuard } from "../security/freeze.guard";
import { AuditService } from "../audit/audit.service";
import { executeTransfer } from "../transfers/transfer-execution.service";
import { createNotification } from "../notifications/notification.service";
import { withIdempotency } from "../idempotency/idempotency.service";
import { getIdempotencyKey } from "../idempotency/idempotency.util";

@Controller("v1/requests")
export class PaymentRequestsController {
  constructor(private auditService: AuditService) {}

  /**
   * Create a payment request (ask someone to pay you).
   */
  @UseGuards(Auth0Guard)
  @Post()
  async create(
    @Req() req: any,
    @Body() body: {
      payerUserId: string;
      amount: number;
      currency?: string;
      note?: string;
    },
  ) {
    const userId = req.localUser?.id || req.user?.sub;

    const request = await prisma.paymentRequest.create({
      data: {
        requesterId: userId,
        requesteeId: body.payerUserId,
        amount: body.amount,
        currency: body.currency || "HTG",
        note: body.note,
        status: "pending",
      },
    });

    // Notify payer
    const requester = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true },
    });

    await createNotification(
      body.payerUserId,
      "Payment Request",
      `${requester?.firstName || "Someone"} requested ${body.amount} ${body.currency || "HTG"} from you.`,
      "transfer",
    );

    await this.auditService.logFinancialAction({
      actorUserId: userId,
      eventType: "payment_request_created",
      amount: body.amount,
      currency: body.currency || "HTG",
      referenceId: request.id,
    });

    return request;
  }

  /**
   * List incoming payment requests (people asking me to pay).
   */
  @UseGuards(Auth0Guard)
  @Get("incoming")
  async incoming(@Req() req: any) {
    const userId = req.localUser?.id || req.user?.sub;

    return prisma.paymentRequest.findMany({
      where: { requesteeId: userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        requester: {
          select: { id: true, firstName: true, lastName: true, handle: true },
        },
      },
    });
  }

  /**
   * List outgoing payment requests (requests I sent).
   */
  @UseGuards(Auth0Guard)
  @Get("outgoing")
  async outgoing(@Req() req: any) {
    const userId = req.localUser?.id || req.user?.sub;

    return prisma.paymentRequest.findMany({
      where: { requesterId: userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        requestee: {
          select: { id: true, firstName: true, lastName: true, handle: true },
        },
      },
    });
  }

  /**
   * Pay a payment request.
   */
  @UseGuards(Auth0Guard, FreezeGuard)
  @Post(":id/pay")
  async pay(@Req() req: any, @Param("id") id: string) {
    const userId = req.localUser?.id || req.user?.sub;
    const idemKey = getIdempotencyKey(req);
    if (!idemKey) throw new Error("Missing Idempotency-Key");

    const request = await prisma.paymentRequest.findUnique({
      where: { id },
    });

    if (!request) throw new Error("Payment request not found");
    if (request.requesteeId !== userId) throw new Error("Not your request to pay");
    if (request.status !== "pending") throw new Error("Request already handled");

    const result = await withIdempotency({
      userId,
      route: "POST:/v1/requests/:id/pay",
      key: idemKey,
      body: { requestId: id },
      run: async () => {
        const transfer = await executeTransfer({
          senderUserId: userId,
          recipientUserId: request.requesterId,
          amount: Number(request.amount),
          currency: request.currency,
          idempotencyKey: `req_pay_${id}`,
        });

        await prisma.paymentRequest.update({
          where: { id },
          data: { status: "paid", paidAt: new Date() },
        });

        return { ok: true, transferId: transfer.transferId };
      },
    });

    await createNotification(
      request.requesterId,
      "Payment Received",
      `Your request for ${request.amount} ${request.currency} was paid.`,
      "transfer",
    );

    await this.auditService.logFinancialAction({
      actorUserId: userId,
      eventType: "payment_request_paid",
      amount: Number(request.amount),
      currency: request.currency,
      referenceId: id,
    });

    return result;
  }

  /**
   * Decline a payment request.
   */
  @UseGuards(Auth0Guard)
  @Post(":id/decline")
  async decline(@Req() req: any, @Param("id") id: string) {
    const userId = req.localUser?.id || req.user?.sub;

    const request = await prisma.paymentRequest.findUnique({
      where: { id },
    });

    if (!request) throw new Error("Payment request not found");
    if (request.requesteeId !== userId) throw new Error("Not your request");
    if (request.status !== "pending") throw new Error("Request already handled");

    await prisma.paymentRequest.update({
      where: { id },
      data: { status: "declined" },
    });

    await createNotification(
      request.requesterId,
      "Request Declined",
      `Your payment request for ${request.amount} ${request.currency} was declined.`,
      "system",
    );

    await this.auditService.logFinancialAction({
      actorUserId: userId,
      eventType: "payment_request_declined",
      referenceId: id,
    });

    return { ok: true };
  }
}
