import Link from "next/link";
import { ReactNode } from "react";

type WindyButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
};

export default function WindyButton({
  children,
  onClick,
  href,
  disabled,
  style,
  className = "",
}: WindyButtonProps) {
  const content = (
    <>
      <svg className="icon-1" viewBox="0 0 24 24" fill="#d97706" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 8C8 10 7 19 7 19C7 19 16 18 18 9C18.5 6.5 17 8 17 8Z" />
      </svg>
      <svg className="icon-2" viewBox="0 0 24 24" fill="#ea580c" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 8C8 10 7 19 7 19C7 19 16 18 18 9C18.5 6.5 17 8 17 8Z" />
      </svg>
      <svg className="icon-3" viewBox="0 0 24 24" fill="#b45309" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 8C8 10 7 19 7 19C7 19 16 18 18 9C18.5 6.5 17 8 17 8Z" />
      </svg>
      {children}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`btn-windy ${className}`} style={style}>
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn-windy ${className}`}
      style={style}
    >
      {content}
    </button>
  );
}
