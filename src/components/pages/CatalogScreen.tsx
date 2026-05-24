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

    const encodedItems = encodeURIComponent(JSON.stringify(itemsToReserve));
    router.push(`/reserve/processing?items=${encodedItems}`);
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
      
      <BackgroundOrbs />

      <div 
        className={`animate-fade-in catalog-container ${selectedCount > 0 ? "bulk-active" : ""}`}
      >
        
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

        <div 
          className="glass-card catalog-header-card"
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
          <h1 className="catalog-header-title">
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

        <div style={{ display: "flex", gap: "30px", alignItems: "flex-start", flexWrap: "wrap" }}>

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
              <div className="product-grid">
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

      {selectedCount > 0 && (
        <div 
          className="glass-card animate-fade-in bulk-order-bar"
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span className="bulk-order-bar-label">
              Bulk Allocation Pipeline
            </span>
            <span className="bulk-order-bar-value">
              {selectedCount} item(s) selected
            </span>
          </div>

          <button
            onClick={handleBulkReserve}
            className="btn-primary bulk-order-bar-button"
          >
            Reserve Selection
          </button>
        </div>
      )}
    </div>
  );
}
