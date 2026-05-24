import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withIdempotency } from "@/lib/idempotency";

export async function POST(req: NextRequest) {
  const idempotencyKey = req.headers.get("Idempotency-Key");

  let body: { ids: number[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { ids } = body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "Invalid or empty IDs" }, { status: 400 });
  }

  return withIdempotency(idempotencyKey, async () => {
    const results = await prisma.$transaction(async (tx) => {
      const updatedReservations = [];

      for (const resId of ids) {
        const reservation = await tx.reservation.findUnique({
          where: { id: resId },
          include: { product: true, warehouse: true },
        });

        if (!reservation) throw new Error(`NOT_FOUND_${resId}`);
        if (reservation.status === "CONFIRMED") continue;
        if (reservation.status === "RELEASED") throw new Error(`RELEASED_${resId}`);
        if (new Date() > reservation.expiresAt) throw new Error(`EXPIRED_${resId}`);

        // Permanently decrement totalStock and release the reservation hold
        await tx.inventory.updateMany({
          where: {
            productId: reservation.productId,
            warehouseId: reservation.warehouseId,
          },
          data: {
            totalStock: { decrement: reservation.quantity },
            reservedStock: { decrement: reservation.quantity },
          },
        });

        const updated = await tx.reservation.update({
          where: { id: resId },
          data: { status: "CONFIRMED" },
          include: { product: true, warehouse: true },
        });

        updatedReservations.push(updated);
      }

      return updatedReservations;
    }, {
      maxWait: 20000,
      timeout: 40000,
    });

    return {
      data: {
        success: true,
        count: results.length,
      },
      status: 200,
    };
  }).catch((err) => {
    const msg = err instanceof Error ? err.message : "";
    if (msg.startsWith("NOT_FOUND_")) return NextResponse.json({ error: "One or more reservations not found" }, { status: 404 });
    if (msg.startsWith("EXPIRED_")) return NextResponse.json({ error: "One or more reservations have expired" }, { status: 410 });
    if (msg.startsWith("RELEASED_")) return NextResponse.json({ error: "One or more reservations were released" }, { status: 409 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  });
}
