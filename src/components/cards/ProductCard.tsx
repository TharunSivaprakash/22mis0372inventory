"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Product, Warehouse } from "@/types";

type ProductCardProps = {
  product: Product;
  selected: Record<string, boolean>;
  quantities: Record<string, number>;
  onToggleSelect: (productId: number, warehouseId: number) => void;
  onChangeQuantity: (productId: number, warehouseId: number, qty: number) => void;
};

export default function ProductCard({
  product,
  selected,
  quantities,
  onToggleSelect,
  onChangeQuantity,
}: ProductCardProps) {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);

  const handleReserve = (wh: Warehouse) => {
    const key = `${product.id}-${wh.warehouseId}`;
    const qty = quantities[key] ?? 1;
    router.push(`/reserve/processing?productId=${product.id}&warehouseId=${wh.warehouseId}&quantity=${qty}`);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((centerY - y) / centerY) * 15;
    const rotateY = ((x - centerX) / centerX) * 15;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
  };

  const totalAvailable = product.warehouses.reduce((s, w) => s + w.availableStock, 0);

  return (
    <div className="tilt-card-container scroll-reveal">
      <div 
        ref={cardRef}
        className="glass-card tilt-card product-card"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        
        <div style={{ transform: "translateZ(25px)", transformStyle: "preserve-3d" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "8px" }}>
            <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em", fontFamily: "'Outfit', sans-serif" }}>
              {product.name}
            </h2>
            <span 
              className="mono"
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: totalAvailable === 0 ? "var(--red)" : totalAvailable <= 3 ? "var(--amber)" : "var(--green)",
                background: totalAvailable === 0 ? "var(--red-dim)" : totalAvailable <= 3 ? "rgba(245, 158, 11, 0.08)" : "var(--green-dim)",
                border: `1px solid ${totalAvailable === 0 ? "rgba(239, 68, 68, 0.3)" : totalAvailable <= 3 ? "rgba(245, 158, 11, 0.3)" : "rgba(16, 185, 129, 0.3)"}`,
                padding: "2px 8px",
                borderRadius: "6px",
                backdropFilter: "blur(6px)",
              }}>
              {totalAvailable === 0 ? "Out of stock" : `${totalAvailable} left`}
            </span>
          </div>
          <p style={{ color: "var(--text2)", fontSize: "13px", lineHeight: 1.5, transform: "translateZ(15px)" }}>
            {product.description}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", transform: "translateZ(20px)" }}>
          {product.warehouses.map((wh) => {
            const avail = wh.availableStock;
            const key = `${product.id}-${wh.warehouseId}`;
            const isChecked = !!selected[key];
            const qty = quantities[key] ?? 1;

            return (
              <div 
                key={wh.warehouseId} 
                className={`warehouse-row ${isChecked ? "is-checked" : ""}`}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {avail > 0 && (
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleSelect(product.id, wh.warehouseId)}
                      className="warehouse-checkbox"
                    />
                  )}
                  <div>
                    <div className="warehouse-title">
                      {wh.warehouseName} Warehouse
                    </div>
                    <div 
                      className="mono warehouse-subtitle"
                    >
                      Available: {avail}
                      {wh.reservedStock > 0 && (
                        <span style={{ color: "var(--amber)", marginLeft: "8px", fontWeight: 500 }}>
                          ({wh.reservedStock} reserved)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {avail > 0 ? (
                  <div className="warehouse-action-container">
                    <select
                      value={qty}
                      onChange={(e) => onChangeQuantity(product.id, wh.warehouseId, Number(e.target.value))}
                      className="mono glass-select"
                    >
                      {Array.from({ length: avail }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleReserve(wh)}
                      className="btn-primary warehouse-reserve-button"
                    >
                      Reserve
                    </button>
                  </div>
                ) : (
                  <span 
                    className="mono"
                    style={{ fontSize: "11px", color: "var(--text3)", fontWeight: 500 }}>
                    Sold out
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
