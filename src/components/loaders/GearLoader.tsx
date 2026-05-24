"use client";

type GearLoaderProps = {
  isOpen: boolean;
  message?: string;
  submessage?: string;
  mode?: "fullscreen" | "incard";
};

export default function GearLoader({ 
  isOpen, 
  message = "Processing request...", 
  submessage = "",
  mode = "fullscreen"
}: GearLoaderProps) {
  const containerClass = mode === "fullscreen" 
    ? `gear-loader-overlay ${isOpen ? "active" : ""}` 
    : `in-card-loader-overlay ${isOpen ? "active" : ""}`;

  const cardClass = mode === "fullscreen" ? "gear-loader-card" : "";

  return (
    <div className={containerClass}>
      <div className={cardClass}>
        <div className="gearbox">
          <div className="overlay"></div>

          <div className="gear one">
            <div className="gear-inner">
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
            </div>
          </div>

          <div className="gear two">
            <div className="gear-inner">
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
            </div>
          </div>

          <div className="gear three">
            <div className="gear-inner">
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
            </div>
          </div>

          <div className="gear four large">
            <div className="gear-inner">
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
              <div className="bar"></div>
            </div>
          </div>
        </div>

        {mode === "fullscreen" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div className="gear-loader-submessage">{submessage}</div>
            <div className="gear-loader-message">{message}</div>
          </div>
        ) : (
          <div className="in-card-loader-text-container">
            <div className="in-card-loader-subtitle">{submessage}</div>
            <div className="in-card-loader-title">{message}</div>
          </div>
        )}
      </div>
    </div>
  );
}
