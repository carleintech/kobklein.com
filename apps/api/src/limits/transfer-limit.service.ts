import { prisma } from "../db/prisma";

export async function checkDailyTransferLimit(params: {
  userId: string;
  amount: number;
}) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const sentToday = await prisma.transfer.aggregate({
    where: {
      senderUserId: params.userId,
      createdAt: { gte: todayStart },
      status: "completed",
    },
    _sum: { amount: true },
  });

  const totalToday = Number(sentToday._sum.amount ?? 0);

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { dailyTransferLimit: true },
  });

  const limit = Number(user?.dailyTransferLimit ?? 0);

  if (totalToday + params.amount > limit) {
    throw new Error("Daily transfer limit exceeded");
  }

  return {
    totalToday,
    limit,
    remaining: limit - totalToday,
  };
}
