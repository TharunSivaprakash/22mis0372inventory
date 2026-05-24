import { prisma } from "@/lib/prisma";
import CatalogScreen from "@/components/pages/CatalogScreen";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const { error: errorQuery } = await searchParams;
  const decodedError = errorQuery ? decodeURIComponent(errorQuery) : null;

  const products = await prisma.product.findMany({
    include: {
      inventories: {
        include: { warehouse: true },
      },
    },
    orderBy: { id: "asc" },
  });

  const formatted = products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description ?? "",
    warehouses: p.inventories.map((inv) => ({
      inventoryId: inv.id,
      warehouseId: inv.warehouseId,
      warehouseName: inv.warehouse.name,
      warehouseLocation: inv.warehouse.location,
      availableStock: inv.totalStock - inv.reservedStock,
      reservedStock: inv.reservedStock,
    })),
  }));

  const confirmedReservations = await prisma.reservation.findMany({
    where: { status: "CONFIRMED" },
  });
  const totalUnitsSold = confirmedReservations.reduce((sum, res) => sum + res.quantity, 0);
  const totalRevenue = totalUnitsSold * 80000;
  
  const pendingCount = await prisma.reservation.count({
    where: { status: "PENDING" },
  });

  const totalStock = products.reduce((sum, p) => sum + p.inventories.reduce((isum, inv) => isum + inv.totalStock, 0), 0);
  const totalReserved = products.reduce((sum, p) => sum + p.inventories.reduce((isum, inv) => isum + inv.reservedStock, 0), 0);
  const totalAvailable = totalStock - totalReserved;
  const availablePct = totalStock > 0 ? Math.round((totalAvailable / totalStock) * 100) : 100;

  const circumference = 238.76;
  const strokeDashoffset = circumference - (availablePct / 100) * circumference;

  return (
    <CatalogScreen
      products={formatted}
      confirmedRevenue={totalRevenue}
      unitsSold={totalUnitsSold}
      pendingHolds={pendingCount}
      catalogCount={products.length}
      availablePct={availablePct}
      strokeDashoffset={strokeDashoffset}
      initialError={decodedError}
    />
  );
}

