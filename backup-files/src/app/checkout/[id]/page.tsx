import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import CheckoutScreen from "@/components/pages/CheckoutScreen";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ids?: string; error?: string }>;
}) {
  const { id } = await params;
  const { ids: idsStr, error: errorQuery } = await searchParams;
  const decodedError = errorQuery ? decodeURIComponent(errorQuery) : null;

  let reservationsData: any[] = [];

  if (id === "bulk") {
    if (!idsStr) notFound();
    const ids = idsStr.split(",").map(Number).filter((n) => !isNaN(n));

    const reservations = await prisma.reservation.findMany({
      where: { id: { in: ids } },
      include: { product: true, warehouse: true },
      orderBy: { id: "asc" },
    });

    if (reservations.length === 0) notFound();
    reservationsData = reservations;
  } else {
    const reservationId = parseInt(id);
    if (isNaN(reservationId)) notFound();

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { product: true, warehouse: true },
    });

    if (!reservation) notFound();
    reservationsData = [reservation];
  }

  const formatted = reservationsData.map((res) => ({
    id: res.id,
    status: res.status,
    quantity: res.quantity,
    expiresAt: res.expiresAt.toISOString(),
    createdAt: res.createdAt.toISOString(),
    productId: res.productId,
    productName: res.product.name,
    productDescription: res.product.description ?? "",
    warehouseId: res.warehouseId,
    warehouseName: res.warehouse.name,
    warehouseLocation: res.warehouse.location,
  }));

  return (
    <CheckoutScreen
      initialReservations={formatted}
      isBulk={id === "bulk"}
      initialError={decodedError}
    />
  );
}

