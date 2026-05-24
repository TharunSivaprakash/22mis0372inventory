import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id },
      });

      if (!reservation) {
        throw new Error("RESERVATION_NOT_FOUND");
      }

      if (reservation.status !== "PENDING") {
        return; // Already resolved
      }

      await tx.inventory.update({
        where: {
          productId_warehouseId: {
            productId: reservation.productId,
            warehouseId: reservation.warehouseId,
          },
        },
        data: { reservedStock: { decrement: reservation.quantity } },
      });

      await tx.reservation.update({
        where: { id },
        data: { status: "RELEASED" },
      });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "RESERVATION_NOT_FOUND") {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to release reservation" }, { status: 500 });
  }
}
