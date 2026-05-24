"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/cards/ProductCard";
import BackgroundOrbs from "@/components/layout/BackgroundOrbs";
import { Product } from "@/types";

type CatalogScreenProps = {
  products: Product[];
  confirmedRevenue: number;
  unitsSold: number;
  pendingHolds: number;
  catalogCount: number;
  availablePct: number;
  strokeDashoffset: number;
  initialError?: string | null;
};

export default function CatalogScreen({
  products,
  confirmedRevenue,
  unitsSold,
  pendingHolds,
  catalogCount,
  availablePct,
  strokeDashoffset,
  initialError = null,
}: CatalogScreenProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(initialError);
  
  // Track selections by key: "${productId}-${warehouseId}"
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (initialError) {
      setError(initialError);
    }
  }, [initialError]);

  const handleToggleSelect = (productId: number, warehouseId: number) => {
    const key = `${productId}-${warehouseId}`;
    setSelected((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleChangeQuantity = (productId: number, warehouseId: number, qty: number) => {
    const key = `${productId}-${warehouseId}`;
    setQuantities((prev) => ({
      ...prev,
      [key]: qty,
    }));
  };

  const selectedKeys = Object.keys(selected).filter((key) => selected[key]);
  const selectedCount = selectedKeys.length;

  const handleBulkReserve = () => {
    if (selectedCount === 0) return;

    const itemsToReserve = selectedKeys.map((key) => {
      const [productId, warehouseId] = key.split("-").map(Number);
      const qty = quantities[key] || 1;
      return { productId, warehouseId, quantity: qty };
    });

    // Navigate immediately to our dedicated fullscreen reservation loader route
    const encodedItems = encodeURIComponent(JSON.stringify(itemsToReserve));
    router.push(`/reserve/processing?items=${encodedItems}`);
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
      {/* Reusable Background Floating Glass Orbs */}
      <BackgroundOrbs />

      <div 
        style={{ 
          maxWidth: "1200px", 
          margin: "0 auto", 
          padding: "2.5rem 1.5rem", 
          position: "relative", 
          zIndex: 1 
        }} 
        className="animate-fade-in"
      >
        {/* Error Notification Banner */}
        {error && (
          <div 
            className="mono animate-fade-in"
            style={{
              background: "var(--red-dim)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "12px",
              padding: "12px 18px",
              fontSize: "13px",
              color: "var(--red)",
              marginBottom: "1.5rem",
              backdropFilter: "blur(8px)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>✕ Allocation Error: {error}</span>
            <button 
              onClick={() => {
                setError(null);
                router.replace("/");
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--red)",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Hero Banner */}
        <div 
          className="glass-card"
          style={{
            position: "relative",
            padding: "2.5rem 3rem",
            borderRadius: "16px",
            marginBottom: "2.5rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <span style={{ 
            fontSize: "11px", 
            textTransform: "uppercase", 
            letterSpacing: "0.2em", 
            color: "var(--text3)",
            fontWeight: 600,
            marginBottom: "8px" 
          }}>
            Tharun's Inventory
          </span>
          <h1 style={{ 
            fontSize: "36px", 
            fontWeight: 800, 
            letterSpacing: "-0.03em", 
            color: "var(--text)",
            marginBottom: "10px",
            fontFamily: "'Outfit', sans-serif" 
          }}>
            Inventory Reservation
          </h1>
          <p style={{ 
            fontSize: "14px", 
            color: "var(--text2)", 
            lineHeight: 1.6, 
            maxWidth: "600px" 
          }}>
            Reserve premium high-demand stock below. Check multiple products to initiate bulk checkout holds.
          </p>
        </div>

        {/* Dynamic Sidebar + Grid Layout */}
        <div style={{ display: "flex", gap: "30px", alignItems: "flex-start", flexWrap: "wrap" }}>
          
          {/* Main Registry Column */}
          <div style={{ flex: 1, minWidth: "300px", paddingBottom: selectedCount > 0 ? "80px" : "0" }}>
            {products.length === 0 ? (
              <div 
                className="glass-card"
                style={{ 
                  textAlign: "center", 
                  padding: "5rem 2rem", 
                  color: "var(--text3)" 
                }}
              >
                <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--text2)" }}>No products found in the database registry.</p>
                <code style={{ display: "block", marginTop: "12px", fontSize: "13px", fontFamily: "JetBrains Mono, monospace" }}>
                  npm run db:seed
                </code>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
                gap: "24px",
              }}>
                {products.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product}
                    selected={selected}
                    quantities={quantities}
                    onToggleSelect={handleToggleSelect}
                    onChangeQuantity={handleChangeQuantity}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Floating Glass Showcase Sidebar */}
          <div 
            className="glass-card scroll-reveal"
            style={{
              width: "320px",
              position: "sticky",
              top: "80px",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              flexShrink: 0,
            }}
          >
            {/* Donut Graph */}
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "1rem",
              background: "rgba(255, 255, 255, 0.2)",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.4)",
              boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.4)",
            }}>
              <div style={{ position: "relative", width: "120px", height: "120px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <svg width="120" height="120" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="var(--surface2)"
                    strokeWidth="7"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="var(--accent)"
                    strokeWidth="7"
                    strokeDasharray={238.76}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 0.8s ease-in-out" }}
                  />
                </svg>
                <div style={{
                  position: "absolute",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  textAlign: "center",
                }}>
                  <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--text)", lineHeight: 1 }}>
                    {availablePct}%
                  </span>
                  <span style={{ fontSize: "7px", fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "3px" }}>
                    Available
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ 
                fontSize: "15px", 
                fontWeight: 700, 
                color: "var(--text)", 
                marginBottom: "4px", 
                fontFamily: "'Outfit', sans-serif" 
              }}>
                Sales Performance
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text2)", lineHeight: 1.5 }}>
                Allocations are automatically verified for instant dispatch.
              </p>
            </div>

            {/* Quick Metrics Dashboard */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                <span style={{ color: "var(--text3)" }}>Total Revenue:</span>
                <span className="mono" style={{ color: "var(--green)", fontWeight: 700 }}>
                  ₹{confirmedRevenue.toLocaleString()}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                <span style={{ color: "var(--text3)" }}>Units Dispatched:</span>
                <span className="mono" style={{ color: "var(--text)", fontWeight: 600 }}>
                  {unitsSold} Units
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                <span style={{ color: "var(--text3)" }}>Active Holds:</span>
                <span className="mono" style={{ color: pendingHolds > 0 ? "var(--amber)" : "var(--text3)", fontWeight: 600 }}>
                  {pendingHolds} Active
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", borderTop: "1px dashed var(--border)", paddingTop: "8px", marginTop: "4px" }}>
                <span style={{ color: "var(--text3)", fontSize: "11px" }}>Total Catalog:</span>
                <span className="mono" style={{ color: "var(--text)", fontWeight: 600, fontSize: "11px" }}>
                  {catalogCount} Items
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Floating Satiny Bulk Checkout Glass Bar */}
      {selectedCount > 0 && (
        <div 
          className="glass-card animate-fade-in"
          style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "calc(100% - 48px)",
            maxWidth: "600px",
            padding: "1rem 2rem",
            zIndex: 100,
            background: "rgba(17, 24, 39, 0.85)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "20px",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            backdropFilter: "blur(20px)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255, 255, 255, 0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Bulk Allocation Pipeline
            </span>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#f8fafc" }}>
              {selectedCount} item(s) selected
            </span>
          </div>

          <button
            onClick={handleBulkReserve}
            className="btn-primary"
            style={{
              padding: "8px 22px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'Outfit', sans-serif",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            Reserve Selection
          </button>
        </div>
      )}
    </div>
  );
}
