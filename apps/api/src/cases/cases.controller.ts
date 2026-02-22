import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { prisma } from '../db/prisma';
import { AuditService } from '../audit/audit.service';
import { SupabaseGuard } from '../auth/supabase.guard';
import { findRecipientUserId } from './case.service';
import { createNotification } from '../notifications/notification.service';

@Controller('v1/cases')
@UseGuards(SupabaseGuard)
export class CasesController {
  constructor(
    private auditService: AuditService,
  ) {}

  @Post()
  async createCase(
    @Request() req,
    @Body() body: {
      caseType: 'wrong_recipient' | 'unauthorized' | 'merchant_dispute';
      referenceType?: 'transfer' | 'merchant_payment' | 'cashout' | 'deposit';
      referenceId?: string;
      auditLogId?: string;
      subject?: string;
      description: string;
    },
  ) {
    const userId = req.localUser?.id || req.user?.sub;

    // Validate reference exists if provided
    if (body.referenceId && body.referenceType) {
      switch (body.referenceType) {
        case 'transfer': {
          const transfer = await prisma.transfer.findUnique({
            where: { id: body.referenceId },
          });
          if (!transfer) throw new Error('Transfer not found');
          break;
        }
        // Add other validations as needed
      }
    }

    // Create case
    const caseData = await prisma.case.create({
      data: {
        caseType: body.caseType,
        reporterUserId: userId,
        referenceType: body.referenceType,
        referenceId: body.referenceId,
        auditLogId: body.auditLogId,
        subject: body.subject,
        description: body.description,
        status: 'investigating',
        priority: body.caseType === 'unauthorized' ? 'high' : 'normal',
      },
    });

    // Create initial message
    await prisma.caseMessage.create({
      data: {
        caseId: caseData.id,
        authorRole: 'user',
        authorUserId: userId,
        message: body.description,
      },
    });

    // Auto-freeze for unauthorized transactions
    if (body.caseType === 'unauthorized') {
      // Freeze the reporter's account (victim)
      await prisma.user.update({
        where: { id: userId },
        data: {
          isFrozen: true,
          freezeReason: 'Unauthorized transaction under investigation',
          frozenAt: new Date(),
        },
      });

      // Notify victim
      await createNotification(
        userId,
        'Account Protected',
        'Unauthorized activity reported. Your account is temporarily protected while we investigate.',
        'security',
      );

      const recipientId = await findRecipientUserId(body.referenceType || '', body.referenceId || '');

      const caseActions = [
        {
          caseId: caseData.id,
          actionType: 'freeze_account' as const,
          actorUserId: null, // system action
          meta: { target: userId, reason: 'unauthorized_transaction_case' },
        },
      ];

      if (recipientId) {
        // Freeze recipient account
        await prisma.user.update({
          where: { id: recipientId },
          data: {
            isFrozen: true,
            freezeReason: 'Funds under fraud review',
            frozenAt: new Date(),
          },
        });

        // Notify recipient (neutral wording)
        await createNotification(
          recipientId,
          'Account Restricted',
          'Your account has been temporarily restricted due to a transaction review.',
          'security',
        );

        caseActions.push({
          caseId: caseData.id,
          actionType: 'freeze_account' as const,
          actorUserId: null,
          meta: { target: recipientId, reason: 'fraud_review' },
        });
      }

      // Create case actions
      await prisma.caseAction.createMany({
        data: caseActions,
      });

      // Audit: account frozen events
      await this.auditService.logFinancialAction({
        eventType: 'account_frozen_fraud_review',
        actorUserId: userId,
        referenceId: caseData.id,
        meta: {
          frozenUsers: [userId, recipientId].filter(Boolean),
          caseType: 'unauthorized',
          referenceType: body.referenceType,
          referenceId: body.referenceId,
        },
      });

      // Place funds on hold if we can identify the disputed amount
      if (recipientId && body.referenceType === 'transfer' && body.referenceId) {
        const transfer = await prisma.transfer.findUnique({
          where: { id: body.referenceId },
        });

        if (transfer) {
          const recipientWallet = await prisma.wallet.findFirst({
            where: { userId: recipientId, type: 'USER' },
          });

          if (recipientWallet) {
            await prisma.ledgerEntry.create({
              data: {
                walletId: recipientWallet.id,
                amount: -transfer.amount,
                type: 'hold_debit',
                reference: caseData.id,
              },
            });

            await prisma.caseAction.create({
              data: {
                caseId: caseData.id,
                actionType: 'hold_funds' as const,
                actorUserId: null,
                meta: {
                  walletId: recipientWallet.id,
                  amount: transfer.amount,
                  currency: transfer.currency,
                },
              },
            });
          }
        }
      }
    }

    // Audit log (non-financial, but important for compliance)
    await this.auditService.logFinancialAction({
      eventType: 'case_created',
      actorUserId: userId,
      referenceId: caseData.id,
      meta: {
        caseType: body.caseType,
        referenceType: body.referenceType,
        referenceId: body.referenceId,
      },
    });

    return caseData;
  }

  @Get('my')
  async getMyCases(@Request() req) {
    const userId = req.localUser?.id || req.user?.sub;
    return prisma.case.findMany({
      where: { reporterUserId: userId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // latest message
        },
        actions: {
          orderBy: { createdAt: 'desc' },
          take: 5, // recent actions
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get(':id')
  async getCase(@Request() req, @Param('id') caseId: string) {
    const userId = req.localUser?.id || req.user?.sub;
    const caseData = await prisma.case.findFirst({
      where: {
        id: caseId,
        reporterUserId: userId, // users can only see their own cases
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        actions: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!caseData) throw new Error('Case not found');
    return caseData;
  }

  @Post(':id/messages')
  async addMessage(
    @Request() req,
    @Param('id') caseId: string,
    @Body() body: { message: string },
  ) {
    const userId = req.localUser?.id || req.user?.sub;

    // Verify case ownership
    const caseData = await prisma.case.findFirst({
      where: {
        id: caseId,
        reporterUserId: userId,
      },
    });
    if (!caseData) throw new Error('Case not found');

    return prisma.caseMessage.create({
      data: {
        caseId,
        authorRole: 'user',
        authorUserId: userId,
        message: body.message,
      },
    });
  }
}