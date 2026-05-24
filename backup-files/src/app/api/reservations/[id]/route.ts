import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const reservationId = parseInt(id);
  if (isNaN(reservationId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { product: true, warehouse: true },
  });

  if (!reservation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: reservation.id,
    status: reservation.status,
    quantity: reservation.quantity,
    expiresAt: reservation.expiresAt,
    createdAt: reservation.createdAt,
    productId: reservation.productId,
    productName: reservation.product.name,
    productDescription: reservation.product.description,
    warehouseId: reservation.warehouseId,
    warehouseName: reservation.warehouse.name,
    warehouseLocation: reservation.warehouse.location,
  });
}
