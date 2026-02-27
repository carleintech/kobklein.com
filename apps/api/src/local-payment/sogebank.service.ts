import { Injectable, BadRequestException } from "@nestjs/common";
import { LocalPaymentProvider, InitiateResult, VerifyResult } from "./local-payment.interface";

// TODO: Integrate when Sogebank / BNC API credentials are available.
// Contact: partnerships@sogebank.com
@Injectable()
export class SogebankService implements LocalPaymentProvider {
  async initiate(_userId: string, _amount: number, _currency: string): Promise<InitiateResult> {
    throw new BadRequestException("Sogebank / BNC integration coming soon");
  }

  async verify(_orderId: string): Promise<VerifyResult> {
    throw new BadRequestException("Sogebank / BNC integration coming soon");
  }
}
