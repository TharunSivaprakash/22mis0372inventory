import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withIdempotency } from "@/lib/idempotency";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const idempotencyKey = req.headers.get("Idempotency-Key");

  return withIdempotency(idempotencyKey, async () => {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const reservation = await tx.reservation.findUnique({
          where: { id },
          include: { product: true, warehouse: true },
        });

        if (!reservation) {
          throw new Error("RESERVATION_NOT_FOUND");
        }

        if (reservation.status === "CONFIRMED") {
          return { data: { success: true }, status: 200 };
        }

        if (reservation.status === "RELEASED") {
          throw new Error("RESERVATION_EXPIRED");
        }

        if (new Date(reservation.expiresAt) < new Date()) {
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

          throw new Error("RESERVATION_EXPIRED");
        }

        await tx.inventory.update({
          where: {
            productId_warehouseId: {
              productId: reservation.productId,
              warehouseId: reservation.warehouseId,
            },
          },
          data: {
            totalStock: { decrement: reservation.quantity },
            reservedStock: { decrement: reservation.quantity },
          },
        });

        await tx.reservation.update({
          where: { id },
          data: { status: "CONFIRMED" },
        });

        return { data: { success: true }, status: 200 };
      });

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (message === "RESERVATION_NOT_FOUND") {
        return { data: { error: "Reservation not found" }, status: 404 };
      }
      if (message === "RESERVATION_EXPIRED") {
        return { data: { error: "Hold expired — stock has been released" }, status: 410 };
      }
      throw err;
    }
  });
}
