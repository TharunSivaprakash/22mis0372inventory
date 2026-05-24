"use client";

import WindyButton from "@/components/buttons/WindyButton";
import BackgroundOrbs from "@/components/layout/BackgroundOrbs";
import PageHeader from "@/components/layout/PageHeader";
import DispatchTracker from "@/components/layout/DispatchTracker";

type SuccessScreenProps = {
  id: string;
  idsStr?: string;
  reservations: {
    id: number;
    quantity: number;
    product: {
      name: string;
      description: string;
    };
    warehouse: {
      name: string;
      location: string;
    };
  }[];
};

export default function SuccessScreen({ id, idsStr, reservations }: SuccessScreenProps) {
  // Calculate pricing (mock value ₹80,000 per premium item)
  const itemPrice = 80000;
  const totalQuantity = reservations.reduce((sum, r) => sum + r.quantity, 0);
  const totalPrice = totalQuantity * itemPrice;

  const warehouseNames = Array.from(new Set(reservations.map((r) => r.warehouse.name)));

  return (
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }} className="animate-fade-in">
      {/* Background Floating Glass Orbs */}
      <BackgroundOrbs />

      {/* Mini top header bar */}
      <PageHeader>
        <WindyButton href="/">
          ← Return to Catalog
        </WindyButton>
      </PageHeader>

      <main style={{ maxWidth: "560px", margin: "0 auto", padding: "3rem 1.5rem", position: "relative", zIndex: 1 }}>
        
        {/* Pulsing Green Check Circle Icon */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "2rem", textAlign: "center" }}>
          <div style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: "var(--green-dim)",
            border: "2px solid rgba(16, 185, 129, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "32px",
            color: "var(--green)",
            boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.2)",
            marginBottom: "1rem",
          }} className="pulse-green-checkmark">
            ✓
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.03em", fontFamily: "'Outfit', sans-serif", color: "var(--text)" }}>
            Purchase Confirmed!
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text2)", marginTop: "4px", maxWidth: "380px", lineHeight: 1.5 }}>
            Payment verified successfully. All stock holds have been permanently allocated and finalized for dispatch.
          </p>
        </div>

        {/* Main Glassmorphic Receipt Card */}
        <div className="glass-card" style={{ padding: "2rem", marginBottom: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px dashed var(--border)", paddingBottom: "1rem" }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Invoice ID
              </span>
              <div className="mono" style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", marginTop: "2px" }}>
                {id === "bulk" ? `TXN-BATCH-${idsStr?.slice(0, 10)}` : `TXN-RES-${String(reservations[0].id).padStart(6, "0")}`}
              </div>
            </div>
            <div style={{ textTransform: "uppercase", textAlign: "right" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Status
              </span>
              <div style={{ marginTop: "2px" }}>
                <span className="badge-confirmed" style={{ padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 600 }}>
                  ● PAID
                </span>
              </div>
            </div>
          </div>

          {/* Details breakdown */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid var(--border)", paddingBottom: "6px" }}>
              Allocated Products
            </span>
            
            {reservations.map((res) => (
              <div key={res.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "2px 0" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontWeight: 600, color: "var(--text)" }}>{res.product.name}</span>
                  <span style={{ fontSize: "11px", color: "var(--text3)" }}>{res.warehouse.name} Warehouse ({res.warehouse.location})</span>
                </div>
                <span style={{ fontWeight: 700, color: "var(--text)" }} className="mono">{res.quantity} Unit(s)</span>
              </div>
            ))}

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", borderTop: "1px dashed var(--border)", paddingTop: "12px", marginTop: "4px" }}>
              <span style={{ color: "var(--text3)" }}>Total Items Purchased</span>
              <span style={{ fontWeight: 600, color: "var(--text)" }}>
                {totalQuantity} Unit(s)
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
              <span style={{ fontWeight: 700, color: "var(--text)" }}>Total Paid</span>
              <span className="mono" style={{ fontWeight: 800, color: "var(--green)", fontSize: "16px" }}>
                ₹{totalPrice.toLocaleString()}
              </span>
            </div>
          </div>

        </div>

        {/* Reusable Shipping Progress Timeline */}
        <DispatchTracker warehouseNames={warehouseNames} />

        {/* Back Link Button */}
        <div style={{ display: "flex", gap: "12px" }}>
          <WindyButton
            href="/"
            style={{ flex: 1 }}
          >
            Return to Catalog
          </WindyButton>
        </div>

      </main>
    </div>
  );
}
