"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import GearLoader from "@/components/loaders/GearLoader";
import BackgroundOrbs from "@/components/layout/BackgroundOrbs";

export default function ReserveProcessingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    const performReservation = async () => {
      const spinPromise = new Promise((resolve) => setTimeout(resolve, 2000));

      const itemsStr = searchParams ? searchParams.get("items") : null;
      const productIdStr = searchParams ? searchParams.get("productId") : null;
      const warehouseIdStr = searchParams ? searchParams.get("warehouseId") : null;
      const qtyStr = searchParams ? searchParams.get("quantity") : null;

      let payload: any;
      let isBulk = false;

      if (itemsStr) {
        try {
          payload = JSON.parse(decodeURIComponent(itemsStr));
          isBulk = true;
        } catch {
          router.push(`/?error=${encodeURIComponent("Malformed bulk selection query")}`);
          return;
        }
      } else if (productIdStr && warehouseIdStr && qtyStr) {
        payload = {
          productId: Number(productIdStr),
          warehouseId: Number(warehouseIdStr),
          quantity: Number(qtyStr),
        };
      } else {
        router.push(`/?error=${encodeURIComponent("Missing required reservation parameters")}`);
        return;
      }

      const apiPromise = fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": `reserve-${Date.now()}`,
        },
        body: JSON.stringify(payload),
      });

      try {
        const [_, res] = await Promise.all([spinPromise, apiPromise]);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          router.push(`/?error=${encodeURIComponent(data.error || "Reservation failed")}`);
          return;
        }

        if (isBulk) {
          router.push(`/checkout/bulk?ids=${data.ids.join(",")}`);
        } else {
          router.push(`/checkout/${data.id}`);
        }
      } catch {
        router.push(`/?error=${encodeURIComponent("Network error. Please try again.")}`);
      }
    };

    performReservation();
  }, [router, searchParams]);

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "#0b0f19", overflow: "hidden" }}>
      
      <BackgroundOrbs opacity1={0.45} opacity2={0.35} opacity3={0.35} />

      <GearLoader 
        isOpen={true} 
        message="Securing inventory allocations" 
        submessage=""
      />
    </div>
  );
}

