import { randomInt } from "crypto";

function generateCode() {
  return randomInt(100000, 999999).toString();
}

export async function generateMerchantCode(prisma: any) {
  let code = generateCode();

  while (
    await prisma.merchant.findUnique({
      where: { paymentCode: code },
    })
  ) {
    code = generateCode();
  }

  return code;
}