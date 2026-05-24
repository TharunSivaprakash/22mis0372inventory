

"use client";

type DispatchTrackerProps = {
  warehouseNames: string[];
};

export default function DispatchTracker({ warehouseNames }: DispatchTrackerProps) {
  const originText = warehouseNames.length > 1 
    ? "multiple origin" 
    : warehouseNames[0] ? `${warehouseNames[0]} Warehouse` : "origin";

  return (
    <div className="glass-card" style={{ padding: "1.75rem", marginBottom: "2rem" }}>
      <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", marginBottom: "1.25rem", fontFamily: "'Outfit', sans-serif" }}>
        Inventory Dispatch Tracker
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", position: "relative" }}>

        <div style={{
          position: "absolute",
          left: "11px",
          top: "12px",
          bottom: "12px",
          width: "2px",
          background: "linear-gradient(to bottom, var(--green) 60%, var(--surface2) 100%)",
          zIndex: 0,
        }} />

        <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", position: "relative", zIndex: 1 }}>
          <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--green)", border: "4px solid var(--green-dim)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }} />
          <div>
            <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>Order Confirmed</h4>
            <p style={{ fontSize: "11px", color: "var(--text3)", marginTop: "2px" }}>Payment received & secure checkout session completed.</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", position: "relative", zIndex: 1 }}>
          <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--green)", border: "4px solid var(--green-dim)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }} />
          <div>
            <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>Stock Allocated Safely</h4>
            <p style={{ fontSize: "11px", color: "var(--text3)", marginTop: "2px" }}>Database locks successfully released. Stock permanently deducted from inventory registry.</p>
          </div>
        </div>

        <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", position: "relative", zIndex: 1 }}>
          <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "rgba(99, 102, 241, 0.2)", border: "4px solid rgba(99, 102, 241, 0.4)", display: "flex", alignItems: "center", justifyContent: "center" }} className="pulse-amber" />
          <div>
            <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--accent)" }} className="pulse-amber">Awaiting Dispatch</h4>
            <p style={{ fontSize: "11px", color: "var(--text3)", marginTop: "2px" }}>
              Securing carrier schedule. Preparing shipment packages at {originText} packages.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
