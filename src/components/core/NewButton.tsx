import type { ReactNode } from "react";

export default function Button({
  children,
  active = false,
  onClick,
  className = "",
  activeClassName = "bg-cyan-300 text-zinc-900",
  ariaLabel,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  activeClassName?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      className={`rounded-xs cursor-pointer hover:opacity-75 active:opacity-50 ${active
        ? activeClassName
        : "bg-zinc-900 text-zinc-100 border border-zinc-600"
        } ${className}`}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
