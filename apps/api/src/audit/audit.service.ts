import { Injectable } from "@nestjs/common";
import { prisma } from "../db/prisma";

@Injectable()
export class AuditService {
  async logFinancialAction(params: {
    actorUserId?: string;
    eventType: string;
    amount?: number;
    currency?: string;
    fromWalletId?: string;
    toWalletId?: string;
    referenceId?: string;
    ip?: string;
    userAgent?: string;
    meta?: any;
  }) {
    await prisma.auditLog.create({
      data: {
        actorUserId: params.actorUserId,
        eventType: params.eventType,
        amount: params.amount,
        currency: params.currency,
        fromWalletId: params.fromWalletId,
        toWalletId: params.toWalletId,
        referenceId: params.referenceId,
        ip: params.ip,
        userAgent: params.userAgent,
        meta: params.meta || {},
      },
    });
  }
}
