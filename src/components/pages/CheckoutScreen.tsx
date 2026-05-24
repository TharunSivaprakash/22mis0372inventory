"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import GearLoader from "@/components/loaders/GearLoader";
import WindyButton from "@/components/buttons/WindyButton";
import BackgroundOrbs from "@/components/layout/BackgroundOrbs";
import PageHeader from "@/components/layout/PageHeader";
import { useCountdown } from "@/hooks/useCountdown";
import { Reservation } from "@/types";

type CheckoutScreenProps = {
  initialReservations: Reservation[];
  isBulk: boolean;
  initialError?: string | null;
};

export default function CheckoutScreen({
  initialReservations,
  isBulk,
  initialError = null,
}: CheckoutScreenProps) {
  const router = useRouter();

  const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
  const [actionLoading, setActionLoading] = useState<"confirm" | "cancel" | null>(null);
  const [error, setError] = useState<string | null>(initialError);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialError) {
      setError(initialError);
    }
  }, [initialError]);

  const soonest = reservations.reduce((soon, r) => {
    if (soon.status !== "PENDING") return r;
    if (r.status !== "PENDING") return soon;
    return new Date(r.expiresAt) < new Date(soon.expiresAt) ? r : soon;
  }, reservations[0]);

  const overallStatus = reservations.every((r) => r.status === "CONFIRMED")
    ? "CONFIRMED"
    : reservations.some((r) => r.status === "RELEASED")
    ? "RELEASED"
    : "PENDING";

  const { display, isExpired, isUrgent, secondsLeft } = useCountdown(
    soonest.expiresAt,
    overallStatus
  );

  const poll = useCallback(async () => {
    if (overallStatus !== "PENDING") return;
    try {
      const updated = await Promise.all(
        reservations.map(async (r) => {
          if (r.status !== "PENDING") return r;
          const res = await fetch(`/api/reservations/${r.id}`);
          if (res.ok) {
            const data = await res.json();
            return { ...r, status: data.status as "PENDING" | "CONFIRMED" | "RELEASED" };
          }
          return r;
        })
      );
      if (JSON.stringify(updated) !== JSON.stringify(reservations)) {
        setReservations(updated);
      }
    } catch {
    }
  }, [reservations, overallStatus]);

  useEffect(() => {
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [poll]);

  const handleConfirm = async () => {
    if (overallStatus !== "PENDING") return;
    const idsList = reservations.map((r) => r.id).join(",");
    router.push(`/checkout/${isBulk ? "bulk" : soonest.id}/processing?ids=${idsList}`);
  };

  const handleCancel = async () => {
    if (actionLoading) return;
    if (overallStatus !== "PENDING") {
      router.push("/");
      return;
    }
    setActionLoading("cancel");
    setError(null);

    try {
      const pendingReservations = reservations.filter((r) => r.status === "PENDING");
      
      await Promise.all(
        pendingReservations.map(async (r) => {
          const res = await fetch(`/api/reservations/${r.id}/release`, {
            method: "POST",
          });
          if (!res.ok) throw new Error(`Failed to release hold ID ${r.id}`);
        })
      );

      setReservations((prev) => prev.map((r) => ({ ...r, status: "RELEASED" })));
      setSuccessMsg("Reservations cancelled successfully. Inventory stock returned.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel checkout holds");
    } finally {
      setActionLoading(null);
    }
  };

  const totalQuantity = reservations.reduce((sum, r) => sum + r.quantity, 0);
  const totalPrice = totalQuantity * 80000;

  const progressPct = (() => {
    if (overallStatus !== "PENDING") return 0;
    const total = 10 * 60;
    return Math.min(100, (secondsLeft / total) * 100);
  })();

  return (
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }} className="animate-fade-in">
      
      <BackgroundOrbs />

      <GearLoader 
        isOpen={actionLoading === "cancel"} 
        message="Releasing stock reservations..." 
      />

      <PageHeader>
        <WindyButton onClick={() => router.push("/")}>
          ← Back to Inventory
        </WindyButton>
      </PageHeader>

      <main style={{ maxWidth: "500px", margin: "0 auto", padding: "3rem 1.5rem", position: "relative", zIndex: 1 }}>
        
        {overallStatus !== "PENDING" && (
          <div
            style={{
              marginBottom: "1.5rem",
              padding: "12px 16px",
              borderRadius: "10px",
              border: "1px solid",
              fontSize: "13px",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backdropFilter: "blur(8px)",
              ...(overallStatus === "CONFIRMED"
                ? {
                    background: "var(--green-dim)",
                    borderColor: "rgba(16, 185, 129, 0.3)",
                    color: "var(--green)",
                  }
                : {
                    background: "var(--red-dim)",
                    borderColor: "rgba(239, 68, 68, 0.3)",
                    color: "var(--red)",
                  }),
            }}
          >
            {overallStatus === "CONFIRMED" ? "✓" : "✗"}
            <span>
              {successMsg ||
                (overallStatus === "CONFIRMED"
                  ? "Purchase confirmed! Stock has been deducted."
                  : "Reservations expired or cancelled. Stock released.")}
            </span>
          </div>
        )}

        {error && (
          <div
            style={{
              marginBottom: "1.5rem",
              padding: "12px 16px",
              borderRadius: "10px",
              background: "var(--red-dim)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "var(--red)",
              fontSize: "13px",
              fontFamily: "JetBrains Mono, monospace",
              backdropFilter: "blur(8px)",
            }}
          >
            ✗ {error}
          </div>
        )}

        <div className="glass-card" style={{ overflow: "hidden" }}>
          
          <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)" }}>
            <h1 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: "4px", fontFamily: "'Outfit', sans-serif" }}>
              {isBulk ? "Bulk Checkout Invoice" : "Checkout Invoice"}
            </h1>
            <p style={{ fontSize: "11px", color: "var(--text3)", fontFamily: "JetBrains Mono, monospace" }}>
              {isBulk ? `AGGREGATE BATCH (${reservations.length} ITEMS)` : `HOLD ID: RES-${String(soonest.id).padStart(6, "0")}`}
            </p>
          </div>

          <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "12px" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
              Items Allocation List
            </span>
            {reservations.map((res) => (
              <div key={res.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", padding: "4px 0" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontWeight: 600, color: "var(--text)" }}>{res.productName}</span>
                  <span style={{ fontSize: "11px", color: "var(--text3)" }}>{res.warehouseName} Warehouse</span>
                </div>
                <span style={{ fontWeight: 700, color: "var(--text)" }} className="mono">
                  {res.quantity} Unit(s)
                </span>
              </div>
            ))}
          </div>

          <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
              <span style={{ color: "var(--text2)" }}>Total Quantity</span>
              <span style={{ fontWeight: 600, color: "var(--text)" }}>{totalQuantity} Unit(s)</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px", borderTop: "1px dashed var(--border)", paddingTop: "10px", marginTop: "4px" }}>
              <span style={{ fontWeight: 700, color: "var(--text)" }}>Aggregate Value</span>
              <span className="mono" style={{ fontWeight: 800, color: "var(--green)", fontSize: "16px" }}>
                ₹{totalPrice.toLocaleString()}
              </span>
            </div>
          </div>

          <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
              {overallStatus === "PENDING" ? "Hold Expiry Countdown" : "Holds Status"}
            </div>

            {overallStatus === "PENDING" ? (
              <>
                <div
                  style={{
                    fontSize: "32px",
                    fontFamily: "JetBrains Mono, monospace",
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                    color: isExpired ? "var(--red)" : isUrgent ? "var(--amber)" : "var(--text)",
                    marginBottom: "12px",
                  }}
                  className={isUrgent && !isExpired ? "pulse-amber" : ""}
                >
                  {isExpired ? "EXPIRED" : display}
                </div>
                <div style={{ height: "6px", background: "rgba(255, 255, 255, 0.4)", borderRadius: "3px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.6)" }}>
                  <div
                     style={{
                      height: "100%",
                      width: `${progressPct}%`,
                      background: isExpired ? "var(--red)" : isUrgent ? "var(--amber)" : "var(--accent)",
                      transition: "width 1s linear, background 0.2s",
                    }}
                  />
                </div>
                <p style={{ fontSize: "11px", color: "var(--text3)", marginTop: "8px", lineHeight: 1.4 }}>
                  Secure items will be released back to the general catalog pool if checkout processes are not finalized before the countdown terminates.
                </p>
              </>
            ) : (
              <span
                className={overallStatus === "CONFIRMED" ? "badge-confirmed" : "badge-released"}
                style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {overallStatus === "CONFIRMED" ? "✓ Confirmed" : "✗ Released"}
              </span>
            )}
          </div>

          {overallStatus === "PENDING" && (
            <div style={{ padding: "1.25rem 1.5rem", display: "flex", gap: "12px", background: "rgba(255, 255, 255, 0.15)", borderTop: "1px solid rgba(255, 255, 255, 0.3)" }}>
              <button
                onClick={handleConfirm}
                disabled={isExpired}
                className="btn-primary"
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: isExpired ? "not-allowed" : "pointer",
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                Confirm Purchase
              </button>

              <WindyButton onClick={handleCancel}>
                Cancel
              </WindyButton>
            </div>
          )}

          {overallStatus !== "PENDING" && (
            <div style={{ padding: "1.25rem 1.5rem", background: "rgba(255, 255, 255, 0.15)" }}>
              <WindyButton onClick={() => router.push("/")} style={{ width: "100%" }}>
                ← Return to Catalog
              </WindyButton>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
