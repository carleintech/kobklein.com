import { Injectable, BadRequestException } from "@nestjs/common";
import { LocalPaymentProvider, InitiateResult, VerifyResult } from "./local-payment.interface";

// TODO: Integrate when Natcom Mobile Money API credentials are available.
// API docs: https://natcom.com.ht (pending partnership)
@Injectable()
export class NatcomService implements LocalPaymentProvider {
  async initiate(_userId: string, _amount: number, _currency: string): Promise<InitiateResult> {
    throw new BadRequestException("Natcom Mobile Money integration coming soon");
  }

  async verify(_orderId: string): Promise<VerifyResult> {
    throw new BadRequestException("Natcom Mobile Money integration coming soon");
  }
}
