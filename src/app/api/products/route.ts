import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const products = await prisma.product.findMany({
    include: {
      inventories: {
        include: { warehouse: true },
        where: { totalStock: { gt: 0 } },
      },
    },
  });

  const result = products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    warehouses: p.inventories.map((inv) => ({
      inventoryId: inv.id,
      warehouseId: inv.warehouseId,
      warehouseName: inv.warehouse.name,
      warehouseLocation: inv.warehouse.location,
      totalStock: inv.totalStock,
      reservedStock: inv.reservedStock,
      availableStock: inv.totalStock - inv.reservedStock,
    })),
  }));

  return NextResponse.json(result);
}
