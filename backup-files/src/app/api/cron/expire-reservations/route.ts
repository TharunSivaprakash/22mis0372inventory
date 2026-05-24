import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Called by Vercel Cron every minute
// vercel.json: { "crons": [{ "path": "/api/cron/expire-reservations", "schedule": "* * * * *" }] }
export async function GET(req: NextRequest) {
  // Protect with a secret so only Vercel Cron (or you) can call it
  const authHeader = req.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Find all expired PENDING reservations
  const expired = await prisma.reservation.findMany({
    where: {
      status: "PENDING",
      expiresAt: { lt: now },
    },
  });

  let released = 0;
  for (const res of expired) {
    await prisma.$transaction(async (tx) => {
      await tx.inventory.updateMany({
        where: {
          productId: res.productId,
          warehouseId: res.warehouseId,
        },
        data: { reservedStock: { decrement: res.quantity } },
      });
      await tx.reservation.update({
        where: { id: res.id },
        data: { status: "RELEASED" },
      });
    }, {
      maxWait: 15000,
      timeout: 30000,
    });
    released++;
  }

  return NextResponse.json({
    message: `Released ${released} expired reservation(s)`,
    releasedIds: expired.map((r) => r.id),
    timestamp: now.toISOString(),
  });
}
