"use client";

import { useEffect, useRef, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import GearLoader from "@/components/loaders/GearLoader";
import BackgroundOrbs from "@/components/layout/BackgroundOrbs";

function ProcessingInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params.id as string;
  const idsStr = searchParams ? searchParams.get("ids") : null;
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (!id || hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    const processPayment = async () => {
      const spinPromise = new Promise((resolve) => setTimeout(resolve, 2000));

      const isBulk = id === "bulk";
      let apiPromise: Promise<Response>;

      if (isBulk) {
        if (!idsStr) {
          router.push(`/?error=${encodeURIComponent("Missing bulk reservation IDs")}`);
          return;
        }
        const ids = idsStr.split(",").map(Number);
        apiPromise = fetch("/api/reservations/confirm-bulk", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": `checkout-bulk-${idsStr}-${Date.now()}-confirm`,
          },
          body: JSON.stringify({ ids }),
        });
      } else {
        apiPromise = fetch(`/api/reservations/${id}/confirm`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": `checkout-${id}-${Date.now()}-confirm`,
          },
        });
      }

      try {
        const [_, res] = await Promise.all([spinPromise, apiPromise]);
        
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          let errMsg = data.error || "Failed to confirm reservation";
          
          if (res.status === 410) {
            errMsg = "One or more reservations expired — stock has been released.";
          }
          
          if (isBulk) {
            router.push(`/checkout/bulk?ids=${idsStr}&error=${encodeURIComponent(errMsg)}`);
          } else {
            router.push(`/checkout/${id}?error=${encodeURIComponent(errMsg)}`);
          }
          return;
        }

        if (isBulk) {
          router.push(`/checkout/bulk/success?ids=${idsStr}`);
        } else {
          router.push(`/checkout/${id}/success`);
        }
      } catch {
        if (isBulk) {
          router.push(`/checkout/bulk?ids=${idsStr}&error=${encodeURIComponent("Network error. Please try again.")}`);
        } else {
          router.push(`/checkout/${id}?error=${encodeURIComponent("Network error. Please try again.")}`);
        }
      }
    };

    processPayment();
  }, [id, idsStr, router]);

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "#0b0f19", overflow: "hidden" }}>
      <BackgroundOrbs opacity1={0.45} opacity2={0.35} opacity3={0.35} />

      <GearLoader 
        isOpen={true} 
        message="Processing checkout & secure payment" 
        submessage=""
      />
    </div>
  );
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={
      <div style={{ position: "relative", minHeight: "100vh", background: "#0b0f19", overflow: "hidden" }}>
        <BackgroundOrbs opacity1={0.45} opacity2={0.35} opacity3={0.35} />
        <GearLoader 
          isOpen={true} 
          message="Processing checkout & secure payment" 
          submessage=""
        />
      </div>
    }>
      <ProcessingInner />
    </Suspense>
  );
}
