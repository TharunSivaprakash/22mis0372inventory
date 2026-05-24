import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withIdempotency } from "@/lib/idempotency";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const reservationId = parseInt(id);
  if (isNaN(reservationId)) {
    return NextResponse.json({ error: "Invalid reservation ID" }, { status: 400 });
  }

  const idempotencyKey = req.headers.get("Idempotency-Key");

  return withIdempotency(idempotencyKey, async () => {
    const result = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
        include: { product: true, warehouse: true },
      });

      if (!reservation) throw new Error("NOT_FOUND");
      if (reservation.status === "CONFIRMED") throw new Error("ALREADY_CONFIRMED");
      if (reservation.status === "RELEASED") throw new Error("ALREADY_RELEASED");
      if (new Date() > reservation.expiresAt) throw new Error("EXPIRED");

      // Permanently decrement totalStock, release the reservation hold
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
        where: { id: reservationId },
        data: { status: "CONFIRMED" },
        include: { product: true, warehouse: true },
      });

      return updated;
    }, {
      maxWait: 15000,
      timeout: 30000,
    });

    return {
      data: {
        id: result.id,
        status: result.status,
        productName: result.product.name,
        warehouseName: result.warehouse.name,
        quantity: result.quantity,
        confirmedAt: result.updatedAt,
      },
      status: 200,
    };
  }).catch((err) => {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "NOT_FOUND") return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    if (msg === "EXPIRED") return NextResponse.json({ error: "Reservation has expired" }, { status: 410 });
    if (msg === "ALREADY_CONFIRMED") return NextResponse.json({ error: "Already confirmed" }, { status: 409 });
    if (msg === "ALREADY_RELEASED") return NextResponse.json({ error: "Reservation was released" }, { status: 409 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  });
}
