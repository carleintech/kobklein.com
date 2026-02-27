import { Module } from "@nestjs/common";
import { MoncashService } from "./moncash.service";
import { NatcomService } from "./natcom.service";
import { SogebankService } from "./sogebank.service";
import { LocalPaymentController } from "./local-payment.controller";
import { MoncashWebhookController } from "./moncash-webhook.controller";

@Module({
  controllers: [LocalPaymentController, MoncashWebhookController],
  providers: [MoncashService, NatcomService, SogebankService],
  exports: [MoncashService],
})
export class LocalPaymentModule {}
