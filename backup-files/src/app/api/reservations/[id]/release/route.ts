import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const reservationId = parseInt(id);
  if (isNaN(reservationId)) {
    return NextResponse.json({ error: "Invalid reservation ID" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
        include: { product: true, warehouse: true },
      });

      if (!reservation) throw new Error("NOT_FOUND");
      if (reservation.status !== "PENDING") throw new Error("NOT_PENDING");

      // Release reserved stock
      await tx.inventory.updateMany({
        where: {
          productId: reservation.productId,
          warehouseId: reservation.warehouseId,
        },
        data: { reservedStock: { decrement: reservation.quantity } },
      });

      const updated = await tx.reservation.update({
        where: { id: reservationId },
        data: { status: "RELEASED" },
        include: { product: true, warehouse: true },
      });

      return updated;
    }, {
      maxWait: 15000,
      timeout: 30000,
    });

    return NextResponse.json({
      id: result.id,
      status: result.status,
      productName: result.product.name,
      warehouseName: result.warehouse.name,
      quantity: result.quantity,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "NOT_FOUND") return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    if (msg === "NOT_PENDING") return NextResponse.json({ error: "Reservation is not in PENDING state" }, { status: 409 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
