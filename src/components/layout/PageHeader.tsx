"use client";

import { ReactNode } from "react";

type PageHeaderProps = {
  children?: ReactNode;
};

export default function PageHeader({ children }: PageHeaderProps) {
  return (
    <header
      style={{
        borderBottom: "1px solid var(--border)",
        padding: "0 1.5rem",
        height: "56px",
        display: "flex",
        alignItems: "center",
        background: "rgba(255, 255, 255, 0.45)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      {children}
    </header>
  );
}
