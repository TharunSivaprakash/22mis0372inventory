import { useState, useEffect } from "react";

export function useCountdown(expiresAt: string, status: string) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (status !== "PENDING") {
      setSecondsLeft(0);
      return;
    }
    const calc = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, status]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const display = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  const isExpired = secondsLeft === 0 && status === "PENDING";
  const isUrgent = secondsLeft <= 60 && secondsLeft > 0;

  return { secondsLeft, display, isExpired, isUrgent };
}
