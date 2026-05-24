"use client";

type BackgroundOrbsProps = {
  opacity1?: number;
  opacity2?: number;
  opacity3?: number;
};

export default function BackgroundOrbs({ opacity1, opacity2, opacity3 }: BackgroundOrbsProps) {
  return (
    <>
      <div className="bg-orb bg-orb-1" style={opacity1 !== undefined ? { opacity: opacity1 } : undefined} />
      <div className="bg-orb bg-orb-2" style={opacity2 !== undefined ? { opacity: opacity2 } : undefined} />
      <div className="bg-orb bg-orb-3" style={opacity3 !== undefined ? { opacity: opacity3 } : undefined} />
    </>
  );
}
