import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: { product: true, warehouse: true },
  });

  if (!reservation) {
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: reservation.id,
    productId: reservation.productId,
    productName: reservation.product.name,
    warehouseId: reservation.warehouseId,
    warehouseName: reservation.warehouse.name,
    quantity: reservation.quantity,
    status: reservation.status,
    expiresAt: reservation.expiresAt.toISOString(),
    createdAt: reservation.createdAt.toISOString(),
  });
}
