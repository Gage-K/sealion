import type { ReactNode } from "react";
import clsx from "clsx";

/**
 * Flat terminal keycap used for track selection. Matches the app's other
 * buttons (dark face, 1px border, cyan selection) and keeps a small LED line
 * under the legend as a status light: cyan when selected, red for "alert"
 * (a muted track), dim otherwise. No skeuomorphic 3D — just the terminal look.
 *
 * `led` is independent of `active` so a key can be lit, unlit, or flagged
 * regardless of whether it's the selected one — "alert" always wins.
 */
export default function KeyButton({
  children,
  active = false,
  led,
  onClick,
  className = "",
  ariaLabel,
}: {
  children: ReactNode;
  active?: boolean;
  /** Omit to follow `active`; "alert" always reads as a warning. */
  led?: "off" | "on" | "alert";
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
}) {
  const ledColor =
    led === "alert"
      ? "bg-red-500"
      : active || led === "on"
        ? "bg-cyan-300"
        : "bg-zinc-700";

  return (
    <button
      type="button"
      className={clsx(
        "flex flex-col items-center justify-center gap-1 rounded-xs border py-1.5 cursor-pointer transition-colors",
        active
          ? "bg-cyan-300 text-zinc-900 border-cyan-300"
          : "bg-zinc-900 text-zinc-300 border-zinc-600 hover:bg-zinc-800",
        className,
      )}
      onClick={onClick}
      aria-pressed={active}
      aria-label={ariaLabel}
    >
      <span className="leading-none" style={{ fontSize: "var(--key-font, 0.5rem)" }}>
        {children}
      </span>
      {led !== "off" && (
        <span
          aria-hidden="true"
          className={clsx(
            "h-0.5 w-1/2 rounded-full",
            active && led !== "alert" ? "bg-zinc-900/40" : ledColor,
          )}
        />
      )}
    </button>
  );
}
