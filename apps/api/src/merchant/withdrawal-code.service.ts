import { randomInt } from "crypto";

function genCode() {
  return randomInt(100000, 999999).toString();
}

export async function generateUniqueWithdrawalCode(prisma: any) {
  let code = genCode();

  while (
    await prisma.merchantWithdrawal.findUnique({
      where: { code },
    })
  ) {
    code = genCode();
  }

  return code;
}