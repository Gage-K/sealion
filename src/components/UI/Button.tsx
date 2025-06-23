import { clsx } from "clsx";
import { Pause, Play } from "phosphor-react";
import styles from "./Button.module.css";

// Defining base colors
type BaseColor = "dark" | "light" | "yellow";

// Defining different roles of buttons
type ButtonState = "primary" | "secondary" | "tertiary" | "default";

// Defining the base colors for each button
const colorMap: Record<
  BaseColor,
  {
    base: string;
    text: string;
    active: string;
    activeText: string;
  }
> = {
  dark: {
    base: "bg-zinc-700",
    text: "text-zinc-500",
    active: "active:bg-zinc-800",
    activeText: "active:text-zinc-400",
  },
  light: {
    base: "bg-zinc-300",
    text: "text-zinc-800",
    active: "active:bg-zinc-300/90",
    activeText: "active:text-zinc-800",
  },
  yellow: {
    base: "bg-amber-300",
    text: "text-amber-950",
    active: "active:bg-amber-500",
    activeText: "active:text-amber-950",
  },
};

// Defining the colors for each state
const stateColors: Record<ButtonState, string> = {
  primary: "bg-zinc-50",
  secondary: "bg-green-500",
  tertiary: "bg-amber-500",
  default: "",
};

interface ButtonProps {
  children?: React.ReactNode;
  text?: string;
  onClick: () => void;
  ariaLabel: string;
  baseColor?: BaseColor;
  span?: number;
  state?: ButtonState;
  className?: string;
  disabled?: boolean;
}

export default function Button({
  children,
  text = "",
  onClick,
  ariaLabel,
  baseColor = "dark",
  span = 1,
  state,
  className = "",
  disabled = false,
}: ButtonProps) {
  const colors = colorMap[baseColor] || colorMap["dark"];
  const stateColor = (state && stateColors[state]) || stateColors["default"];

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className={clsx(
        "outer-button",
        "p-2 rounded-sm cursor-pointer duration-50 transition-ease-in-out",
        `grid ${span > 1 ? `col-span-${span}` : ""} place-items-center `,
        // Colors
        colors.base,
        colors.text,
        colors.active,
        colors.activeText,
        // State Colors
        stateColor,
        // Disabled
        disabled && "opacity-50 cursor-not-allowed",
        // Custom Class Name
        className
      )}>
      <span
        className={clsx(
          styles["inner-button"],
          "w-full h-full rounded-full grid place-items-center"
        )}>
        {text} {children}
      </span>
    </button>
  );
}

export const PlayButton = ({
  isPlaying,
  onToggle,
}: {
  isPlaying: boolean;
  onToggle: () => void;
}) => (
  <Button
    onClick={onToggle}
    ariaLabel={isPlaying ? "Stop Playback" : "Start Playback"}
    baseColor="yellow">
    {isPlaying ? (
      <Pause size={16} weight="fill" />
    ) : (
      <Play size={16} weight="fill" />
    )}
  </Button>
);

export const TrackButton = ({
  trackNumber,
  isActive,
  onSelect,
}: {
  trackNumber: number;
  isActive: boolean;
  onSelect: () => void;
}) => (
  <Button
    text={`T${trackNumber}`}
    onClick={onSelect}
    ariaLabel={`Track ${trackNumber}`}
    baseColor="yellow"
    state={isActive ? "primary" : "default"}
    className="col-span-2"
  />
);

export const StepButton = ({
  stepNumber,
  isCurrent,
  isActive,
  onToggle,
}: {
  stepNumber: number;
  isCurrent: boolean;
  isActive: boolean;
  onToggle: () => void;
}) => (
  <Button
    text={String(stepNumber)}
    onClick={onToggle}
    ariaLabel={`Step ${stepNumber} ${isActive ? "Active" : "Inactive"}`}
    baseColor="light"
    state={
      isActive && isCurrent
        ? "tertiary"
        : isCurrent
        ? "secondary"
        : isActive
        ? "primary"
        : "default"
    }
  />
);

export const UtilityButton = ({
  icon,
  label,
  onClick,
  baseColor = "dark",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  baseColor?: BaseColor;
}) => (
  <Button onClick={onClick} ariaLabel={label} baseColor={baseColor}>
    {icon}
  </Button>
);
