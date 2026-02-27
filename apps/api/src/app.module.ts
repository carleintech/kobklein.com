import { MiddlewareConsumer, Module, NestModule, OnModuleInit } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { SentryModule } from "@sentry/nestjs/setup";
import { HealthController } from "./health.controller";
import { UsersController } from "./users/users.controller";
import { AdminController } from "./admin/admin.controller";
import { TransactionsController } from "./transactions/transactions.controller";
import { WalletsController } from "./wallets/wallets.controller";
import { RiskAdminController } from "./fraud/risk.controller";
import { AuditAdminController } from "./audit/audit.controller";
import { StripeWebhookController } from "./webhooks/stripe.controller";
import { PaymentsController } from "./payments/payments.controller";
import { WithdrawalsController } from "./transactions/withdrawals.controller";
import { SettlementReportsController } from "./reports/settlement.controller";
import { ReconController } from "./recon/recon.controller";
import { ReversalController } from "./reversal/reversal.controller";
import { CaseController } from "./cases/case.controller";
import { CasesModule } from "./cases/cases.module";
import { LiquidityController } from "./admin/liquidity.controller";
import { NotificationsAdminController } from "./admin/notifications.controller";
import { TimelineController } from "./wallets/timeline.controller";
import { WalletBalanceController } from "./wallets/balance.controller";
import { SendMoneyController } from "./transfers/send.controller";
import { RecipientCheckController } from "./transfers/recipient-check.controller";
import { OtpController } from "./auth/otp.controller";
import { MerchantPayController } from "./merchant/pay.controller";
import { MerchantWithdrawController } from "./merchant/withdraw.controller";
import { MerchantSettlementController } from "./distributor/merchant-settle.controller";
import { MerchantStatsController } from "./merchant/merchant-stats.controller";
import { MerchantQRController } from "./merchant/merchant-qr.controller";
import { MerchantPublicController } from "./merchant/merchant-public.controller";
import { FloatController } from "./admin/float.controller";
import { FloatTransferController } from "./distributor/float-transfer.controller";
import { AnalyticsController } from "./admin/analytics.controller";
import { AnalyticsTimeseriesController } from "./admin/analytics-timeseries.controller";
import { AnalyticsRevenueController } from "./admin/analytics-revenue.controller";
import { NotificationController } from "./notifications/notification.controller";
import { NotificationCountController } from "./notifications/notification-count.controller";
import { SelfFreezeController } from "./security/self-freeze.controller";
import { UnlockRequestController } from "./security/unlock-request.controller";
import { UnlockReviewController } from "./admin/unlock-review.controller";
import { CaseHoldsController } from "./admin/case-holds.controller";
import { TransferAttemptController } from "./transfers/transfer-attempt.controller";
import { TransferConfirmController } from "./transfers/transfer-confirm.controller";
import { RecipientsController } from "./users/recipients.controller";
import { PaymentRequestsController } from "./requests/requests.controller";
import { HandlesController } from "./users/handles.controller";
import { ReceiveQRController } from "./users/receive-qr.controller";
import { KycController } from "./kyc/kyc.controller";
import { TransactionsHistoryController } from "./wallets/transactions-history.controller";
import { CashOperationsController } from "./distributor/cash-operations.controller";
import { FamilyController } from "./diaspora/family.controller";
import { CardWaitlistController } from "./cards/card-waitlist.controller";
import { startFloatScheduler } from "./scheduler/float.scheduler";
import { StripeService } from "./services/stripe.service";
import { RequestIdMiddleware } from "./middlewares/request-id.middleware";
import { RateLimitMiddleware } from "./middlewares/rate-limit.middleware";
import { RequestLoggerMiddleware } from "./logger/request-logger.middleware";
import { LanguageMiddleware } from "./middlewares/language.middleware";
import { initRedis } from "./services/redis.client";
import { startEventWorker } from "./services/event-worker";
import { startNotificationWorker } from "./notifications/notification.queue";
import { AuditService } from "./audit/audit.service";
import { DistributorController } from "./distributor/distributor.controller";
import { AdminDistributorController } from "./admin/admin-distributor.controller";
import { DistributorCashInController } from "./distributor/distributor-cashin.controller";
import { DistributorCashOutController } from "./distributor/distributor-cashout.controller";
import { DistributorSummaryController } from "./distributor/distributor-summary.controller";
import { DiasporaSummaryController } from "./diaspora/diaspora-summary.controller";
import { DiasporaTopupController } from "./diaspora/diaspora-topup.controller";
import { DiasporaSendController } from "./diaspora/diaspora-send.controller";
import { VirtualCardsController } from "./cards/virtual-cards.controller";
import { VirtualCardPaymentsController } from "./cards/virtual-card-payments.controller";
import { SubscriptionController } from "./subscriptions/subscription.controller";
import { SubscriptionControlsController } from "./subscriptions/subscription-controls.controller";
import { startBillingScheduler } from "./scheduler/billing.scheduler";
import { startNotificationScheduler } from "./scheduler/notification.scheduler";
import { KpayCatalogController } from "./kpay/kpay-catalog.controller";
import { KpaySubscribeController } from "./kpay/kpay-subscribe.controller";
import { KpayMeController } from "./kpay/kpay-me.controller";
import { ProfileController } from "./profile/profile.controller";
import { MerchantPosRequestController } from "./merchant/pos-request.controller";
import { PayPosController } from "./payments/pay-pos.controller";
import { MerchantReportsController } from "./merchant/merchant-reports.controller";
import { AdminOverviewController } from "./admin/admin-overview.controller";
import { TransferByKIdController } from "./transfers/transfer-kid.controller";
import { AdminUsersController } from "./admin/admin-users.controller";
import { AdminWalletControlsController } from "./admin/admin-wallet-controls.controller";
import { AdminBroadcastController } from "./admin/admin-broadcast.controller";
import { AdminMerchantController } from "./admin/admin-merchant.controller";
import { SupportController } from "./support/support.controller";
import { ScheduledRemittanceController } from "./remittance/scheduled.controller";
import { AdminRiskController } from "./admin/admin-risk.controller";
import { TransferReviewController } from "./admin/transfer-review.controller";
import { startRemittanceScheduler } from "./scheduler/remittance.scheduler";
import { AdminLimitsController } from "./admin/admin-limits.controller";
import { AdminFxController } from "./admin/admin-fx.controller";
import { AdminTreasuryController } from "./admin/admin-treasury.controller";
import { AdminMerchantFeeController } from "./admin/admin-merchant-fee.controller";
import { AdminPosAnalyticsController } from "./admin/admin-pos-analytics.controller";
import { AdminCatalogController } from "./admin/admin-catalog.controller";
import { StepUpController } from "./auth/stepup.controller";
import { DevicesController } from "./security/devices.controller";
import { AdminDevicesController } from "./admin/admin-devices.controller";
import { LockdownController } from "./security/lockdown.controller";
import { AdminComplianceController } from "./admin/admin-compliance.controller";
import { KycUploadController } from "./kyc/kyc-upload.controller";
import { BillingController } from "./billing/billing.controller";
import { AdminPlansController } from "./admin/admin-plans.controller";
import { PushController } from "./push/push.controller";
import { FxPromoController, AdminFxPromoController } from "./fx/fx-promo.controller";
import { AffiliatePromoController } from "./fx/affiliate-promo.controller";
import { DistributorRechargeController, AdminRechargeController } from "./distributor/recharge.controller";
import { AmlController } from "./aml/aml.controller";
import { OnboardingModule } from "./onboarding/onboarding.module";
import { AdminWithdrawalsController } from "./admin/admin-withdrawals.controller";
import { NearbyModule } from "./nearby/nearby.module";
import { CommissionController } from "./distributor/commission.controller";
import { PhysicalCardController } from "./cards/physical-card.controller";
import { LocalPaymentModule } from "./local-payment/local-payment.module";
import { PartnerLeadsController } from "./public/partner-leads.controller";
import { AdminHrController } from "./admin/admin-hr.controller";
import { EmergencyController } from "./admin/emergency.controller";
import { DualControlController } from "./policies/dual-control.controller";
import { DualControlService } from "./policies/dual-control.service";
import { AdminChannelsController } from "./admin/admin-channels.controller";
import { RemittanceHistoryController } from "./diaspora/remittance-history.controller";
import { PlaidController } from "./diaspora/plaid.controller";
import { PlaidService } from "./diaspora/plaid.service";
import { PosDeviceController } from "./merchant/pos-device.controller";
import { PosDeviceService } from "./merchant/pos-device.service";
import { FxLiveController } from "./fx/fx-live.controller";
import { DiasporaStatsController } from "./diaspora/diaspora-stats.controller";
import { EmergencySendController } from "./diaspora/emergency-send.controller";
import { UserTimelineController } from "./wallets/user-timeline.controller";
import { UserLocationController } from "./users/user-location.controller";

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CasesModule,
    OnboardingModule,
    NearbyModule,
    LocalPaymentModule,
  ],
  controllers: [
    HealthController,
    UsersController,
    AdminController,
    TransactionsController,
    WalletsController,
    RiskAdminController,
    AuditAdminController,
    StripeWebhookController,
    PaymentsController,
    WithdrawalsController,
    SettlementReportsController,
    ReconController,
    ReversalController,
    CaseController,
    LiquidityController,
    NotificationsAdminController,
    TimelineController,
    WalletBalanceController,
    SendMoneyController,
    RecipientCheckController,
    OtpController,
    MerchantPayController,
    MerchantWithdrawController,
    MerchantSettlementController,
    MerchantStatsController,
    MerchantQRController,
    MerchantPublicController,
    FloatController,
    FloatTransferController,
    AnalyticsController,
    AnalyticsTimeseriesController,
    AnalyticsRevenueController,
    NotificationController,
    NotificationCountController,
    SelfFreezeController,
    UnlockRequestController,
    UnlockReviewController,
    CaseHoldsController,
    TransferAttemptController,
    TransferConfirmController,
    RecipientsController,
    PaymentRequestsController,
    HandlesController,
    ReceiveQRController,
    KycController,
    TransactionsHistoryController,
    CashOperationsController,
    FamilyController,
    CardWaitlistController,
    DistributorController,
    AdminDistributorController,
    DistributorCashInController,
    DistributorCashOutController,
    DistributorSummaryController,
    DiasporaSummaryController,
    DiasporaTopupController,
    DiasporaSendController,
    VirtualCardsController,
    VirtualCardPaymentsController,
    SubscriptionController,
    SubscriptionControlsController,
    KpayCatalogController,
    KpaySubscribeController,
    KpayMeController,
    ProfileController,
    MerchantPosRequestController,
    PayPosController,
    MerchantReportsController,
    AdminOverviewController,
    TransferByKIdController,
    AdminUsersController,
    AdminWalletControlsController,
    AdminBroadcastController,
    AdminMerchantController,
    SupportController,
    ScheduledRemittanceController,
    AdminRiskController,
    TransferReviewController,
    AdminLimitsController,
    AdminFxController,
    AdminTreasuryController,
    AdminMerchantFeeController,
    AdminPosAnalyticsController,
    AdminCatalogController,
    StepUpController,
    DevicesController,
    AdminDevicesController,
    LockdownController,
    AdminComplianceController,
    KycUploadController,
    BillingController,
    AdminPlansController,
    PushController,
    FxPromoController,
    AdminFxPromoController,
    AffiliatePromoController,
    DistributorRechargeController,
    AdminRechargeController,
    AmlController,
    AdminWithdrawalsController,
    CommissionController,
    PhysicalCardController,
    PartnerLeadsController,
    AdminHrController,
    EmergencyController,
    DualControlController,
    AdminChannelsController,
    RemittanceHistoryController,
    PlaidController,
    PosDeviceController,
    FxLiveController,
    DiasporaStatsController,
    EmergencySendController,
    UserTimelineController,
    UserLocationController,
  ],
  providers: [StripeService, AuditService, DualControlService, PlaidService, PosDeviceService],
})
export class AppModule implements OnModuleInit, NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware, RateLimitMiddleware, RequestLoggerMiddleware, LanguageMiddleware)
      .forRoutes("*");
  }

  async onModuleInit() {
    // Direct SQL connection - no Prisma needed
    console.log("DB ready");

    // Redis is optional in dev — API still works without it (degraded)
    await initRedis();

    // Notification worker depends on ioredis; wrap so API starts without Redis
    try {
      await startNotificationWorker();
    } catch (err) {
      console.warn("⚠ Notification worker failed to start (Redis required):", err instanceof Error ? err.message : err);
    }

    try {
      startEventWorker();
      console.log("Event worker started");
    } catch (err) {
      console.warn("⚠ Event worker failed to start:", err instanceof Error ? err.message : err);
    }

    try {
      startFloatScheduler();
      console.log("Float scheduler started");
      startBillingScheduler();
      console.log("Billing scheduler started");
      startNotificationScheduler();
      console.log("Notification scheduler started");
      startRemittanceScheduler();
      console.log("Remittance scheduler started");
    } catch (err) {
      console.warn("⚠ Some schedulers failed to start:", err instanceof Error ? err.message : err);
    }
  }
}
