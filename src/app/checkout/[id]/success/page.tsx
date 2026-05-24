import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SuccessScreen from "@/components/pages/SuccessScreen";

export const dynamic = "force-dynamic";

type SuccessPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ids?: string }>;
};

export default async function SuccessPage({ params, searchParams }: SuccessPageProps) {
  const { id } = await params;
  const { ids: idsStr } = await searchParams;

  let reservations: any[] = [];

  if (id === "bulk") {
    if (!idsStr) notFound();
    const ids = idsStr.split(",").map(Number).filter((n) => !isNaN(n));

    reservations = await prisma.reservation.findMany({
      where: { id: { in: ids } },
      include: { product: true, warehouse: true },
      orderBy: { id: "asc" },
    });

    if (reservations.length === 0) notFound();
  } else {
    const reservationId = parseInt(id);
    if (isNaN(reservationId)) notFound();

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { product: true, warehouse: true },
    });

    if (!reservation) notFound();
    reservations = [reservation];
  }

  return (
    <SuccessScreen
      id={id}
      idsStr={idsStr}
      reservations={reservations}
    />
  );
}
