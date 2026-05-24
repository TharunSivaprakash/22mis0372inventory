import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withIdempotency } from "@/lib/idempotency";
import { z } from "zod";

const ReserveSchema = z.object({
  productId: z.number().int().positive(),
  warehouseId: z.number().int().positive(),
  quantity: z.number().int().positive().max(100),
});

export async function POST(req: NextRequest) {
  const idempotencyKey = req.headers.get("Idempotency-Key");

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const isBulk = Array.isArray(body);
  const parser = isBulk ? z.array(ReserveSchema) : ReserveSchema;
  const parsed = parser.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const payload = isBulk ? (parsed.data as z.infer<typeof ReserveSchema>[]) : [parsed.data as z.infer<typeof ReserveSchema>];

  return withIdempotency(idempotencyKey, async () => {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const reservations = [];

        for (const item of payload) {
          const { productId, warehouseId, quantity } = item;

          const inventory = await tx.inventory.findFirst({
            where: { productId, warehouseId }
          });

          if (!inventory) {
            throw new Error(`INVENTORY_NOT_FOUND_\${productId}\_\${warehouseId}\`);
          }

          const availableStock = inventory.totalStock - inventory.reservedStock;

          if (availableStock < quantity) {
            throw new Error(`INSUFFICIENT_STOCK_\${productId}\_\${warehouseId}\`);
          }

          await tx.inventory.update({
            where: { id: inventory.id },
            data: { reservedStock: { increment: quantity } },
          });

          const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
          const reservation = await tx.reservation.create({
            data: {
              productId,
              warehouseId,
              quantity,
              status: "PENDING",
              expiresAt,
            },
            include: {
              product: true,
              warehouse: true,
            },
          });

          reservations.push(reservation);
        }

        return reservations;
      });

      if (isBulk) {
        return {
          data: {
            success: true,
            ids: result.map((r) => r.id),
          },
          status: 201,
        };
      } else {
        const singleResult = result[0];
        return {
          data: {
            id: singleResult.id,
            productId: singleResult.productId,
            productName: singleResult.product.name,
            warehouseId: singleResult.warehouseId,
            warehouseName: singleResult.warehouse.name,
            quantity: singleResult.quantity,
            status: singleResult.status,
            expiresAt: singleResult.expiresAt,
            createdAt: singleResult.createdAt,
          },
          status: 201,
        };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      if (message.startsWith("INSUFFICIENT_STOCK_")) {
        return { data: { error: "Not enough stock available for one or more items" }, status: 409 };
      }
      if (message.startsWith("INVENTORY_NOT_FOUND_")) {
        return { data: { error: "One or more items not found in selected warehouse" }, status: 404 };
      }
      throw err;
    }
  });
}

export async function GET() {
  const reservations = await prisma.reservation.findMany({
    include: { product: true, warehouse: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(reservations);
}
