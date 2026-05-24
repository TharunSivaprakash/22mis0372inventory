import type { Metadata } from "next";
import "./globals.css";
import ThemeToggle from "@/components/buttons/ThemeToggle";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Inventory Reservation System",
  description: "Real-time high-demand inventory reservation system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              const theme = localStorage.getItem('theme');
              if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.body.classList.add('dark-mode');
              }
            } catch (e) {}
          })();
        `}} />
      </head>
      <body>
        <header style={{
          borderBottom: "1px solid var(--border)",
          padding: "0 1.5rem",
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          background: "var(--surface)",
          zIndex: 100,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
            <span 
              style={{
                color: "var(--text)", 
                fontSize: "14px", 
                fontWeight: 600,
                letterSpacing: "-0.01em",
              }}
            >
              Inventory Reservation System
            </span>
          </Link>
          
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <ThemeToggle />
            
            {/* Standard SaaS Live status indicator */}
            <span 
              className="mono"
              style={{ 
                color: "var(--text2)", 
                fontSize: "11px", 
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "var(--surface2)",
                padding: "2px 8px",
                borderRadius: "4px",
                border: "1px solid var(--border)",
              }}
            >
              <span style={{
                width: "6px",
                height: "6px",
                background: "var(--green)",
                borderRadius: "50%",
                display: "inline-block"
              }} />
              
            </span>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
