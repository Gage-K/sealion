// import ButtonSmall from "./ButtonSmall";
// import ButtonWrapper from "./ButtonWrapper";
// import clsx from "clsx";

// type BaseColor =
//   | "zinc"
//   | "green"
//   | "red"
//   | "blue"
//   | "yellow"
//   | "indigo"
//   | "purple"
//   | "light";

// const colorMap: Record<
//   BaseColor,
//   {
//     inset: string;
//     background: string;
//     textColor: string;
//     activeBg: string;
//     activeText: string;
//     activeInset: string;
//   }
// > = {
//   zinc: {
//     inset: "inset-shadow-xs inset-shadow-zinc-500/50",
//     background: "bg-zinc-700",
//     textColor: "text-zinc-500",
//     activeBg: "active:bg-zinc-800",
//     activeText: "active:text-zinc-400",
//     activeInset: "active:inset-shadow-zinc-500/10",
//   },
//   light: {
//     inset: "inset-shadow-xs inset-shadow-zinc-200/50",
//     background: "bg-zinc-300",
//     textColor: "text-indigo-600",
//     activeBg: "active:bg-zinc-400",
//     activeText: "active:text-zinc-800",
//     activeInset: "active:inset-shadow-zinc-500/10",
//   },
//   green: {
//     inset: "inset-shadow-xs inset-shadow-lime-500/50",
//     background: "bg-lime-600",
//     textColor: "text-lime-50",
//     activeBg: "active:bg-lime-700",
//     activeText: "active:text-lime-400",
//     activeInset: "active:inset-shadow-lime-500/10",
//   },
//   red: {
//     inset: "inset-shadow-xs inset-shadow-red-500/50",
//     background: "bg-red-600",
//     textColor: "text-red-50",
//     activeBg: "active:bg-red-800",
//     activeText: "active:text-red-400",
//     activeInset: "active:inset-shadow-red-500/10",
//   },
//   blue: {
//     inset: "inset-shadow-xs inset-shadow-blue-500/50",
//     background: "bg-blue-700",
//     textColor: "text-blue-500",
//     activeBg: "active:bg-blue-800",
//     activeText: "active:text-blue-400",
//     activeInset: "active:inset-shadow-blue-700/10",
//   },
//   yellow: {
//     inset: "inset-shadow-xs inset-shadow-amber-300/50",
//     background: "bg-amber-300",
//     textColor: "text-amber-950",
//     activeBg: "active:bg-amber-500",
//     activeText: "active:text-amber-950",
//     activeInset: "active:inset-shadow-amber-300/10",
//   },
//   indigo: {
//     inset: "inset-shadow-xs inset-shadow-indigo-400/50",
//     background: "bg-indigo-500",
//     textColor: "text-indigo-950",
//     activeBg: "active:bg-indigo-600",
//     activeText: "active:text-indigo-950",
//     activeInset: "active:inset-shadow-indigo-400/10",
//   },
//   purple: {
//     inset: "inset-shadow-xs inset-shadow-purple-500/50",
//     background: "bg-purple-500",
//     textColor: "text-purple-950",
//     activeBg: "active:bg-purple-500",
//     activeText: "active:text-purple-950",
//     activeInset: "active:inset-shadow-purple-300/10",
//   },
// };

// interface Props {
//   text: string | number;
//   ariaLabel: string;
//   action: () => void;
//   itemKey?: string | number;
//   baseColor: BaseColor;
//   span?: string;
//   primaryActive: boolean;
//   secondaryActive?: boolean;
//   tertiaryActive?: boolean;
//   styles?: string;
//   children?: React.ReactNode;
// }

// export default function Button({
//   text,
//   ariaLabel,
//   action,
//   itemKey,
//   baseColor,
//   span,
//   primaryActive,
//   secondaryActive,
//   tertiaryActive,
//   children,
// }: Props) {
//   const colors = colorMap[baseColor] || colorMap["zinc"];
//   const wrapperClass = clsx(
//     "cursor-pointer duration-50",
//     colors.inset,
//     colors.activeInset,
//     colors.background,
//     colors.textColor,
//     colors.activeBg,
//     span
//   );

//   const buttonClass = clsx(
//     "active:shadow-black/20 shadow-md shadow-black/50  transition-ease-in-out",
//     colors.inset,
//     colors.activeInset,
//     colors.activeText
//   );

//   return (
//     <>
//       <ButtonWrapper
//         classNames={wrapperClass}
//         action={action}
//         ariaLabel={ariaLabel}
//         itemKey={itemKey}>
//         <ButtonSmall
//           text={text}
//           classNames={buttonClass}
//           primaryActive={primaryActive}
//           secondaryActive={secondaryActive}
//           tertiaryActive={tertiaryActive}>
//           {children}
//         </ButtonSmall>
//       </ButtonWrapper>
//     </>
//   );
// }

import { clsx } from "clsx";
import { Pause, Play } from "phosphor-react";

// Defining base colors
type BaseColor =
  | "zinc"
  | "green"
  | "red"
  | "blue"
  | "yellow"
  | "indigo"
  | "purple"
  | "light";

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
    inset: string;
    activeInset: string;
  }
> = {
  //     inset: "inset-shadow-xs inset-shadow-zinc-500/50",
  //     background: "bg-zinc-700",
  //     textColor: "text-zinc-500",
  //     activeBg: "active:bg-zinc-800",
  //     activeText: "active:text-zinc-400",
  //     activeInset: "active:inset-shadow-zinc-500/10",
  //   },
  //   light: {
  //     inset: "inset-shadow-xs inset-shadow-zinc-200/50",
  //     background: "bg-zinc-300",
  //     textColor: "text-indigo-600",
  //     activeBg: "active:bg-zinc-400",
  //     activeText: "active:text-zinc-800",
  //     activeInset: "active:inset-shadow-zinc-500/10",
  //   },
  //   green: {
  //     inset: "inset-shadow-xs inset-shadow-lime-500/50",
  //     background: "bg-lime-600",
  //     textColor: "text-lime-50",
  //     activeBg: "active:bg-lime-700",
  //     activeText: "active:text-lime-400",
  //     activeInset: "active:inset-shadow-lime-500/10",
  //   },
  //   red: {
  //     inset: "inset-shadow-xs inset-shadow-red-500/50",
  //     background: "bg-red-600",
  //     textColor: "text-red-50",
  //     activeBg: "active:bg-red-800",
  //     activeText: "active:text-red-400",
  //     activeInset: "active:inset-shadow-red-500/10",
  //   },
  //   blue: {
  //     inset: "inset-shadow-xs inset-shadow-blue-500/50",
  //     background: "bg-blue-700",
  //     textColor: "text-blue-500",
  //     activeBg: "active:bg-blue-800",
  //     activeText: "active:text-blue-400",
  //     activeInset: "active:inset-shadow-blue-700/10",
  //   },
  //   yellow: {
  //     inset: "inset-shadow-xs inset-shadow-amber-300/50",
  //     background: "bg-amber-300",
  //     textColor: "text-amber-950",
  //     activeBg: "active:bg-amber-500",
  //     activeText: "active:text-amber-950",
  //     activeInset: "active:inset-shadow-amber-300/10",
  //   },
  //   indigo: {
  //     inset: "inset-shadow-xs inset-shadow-indigo-400/50",
  //     background: "bg-indigo-500",
  //     textColor: "text-indigo-950",
  //     activeBg: "active:bg-indigo-600",
  //     activeText: "active:text-indigo-950",
  //     activeInset: "active:inset-shadow-indigo-400/10",
  //   },
  //   purple: {
  //     inset: "inset-shadow-xs inset-shadow-purple-500/50",
  //     background: "bg-purple-500",
  //     textColor: "text-purple-950",
  //     activeBg: "active:bg-purple-500",
  //     activeText: "active:text-purple-950",
  //     activeInset: "active:inset-shadow-purple-300/10",
  //   },

  zinc: {
    base: "bg-zinc-700",
    text: "text-zinc-500",
    active: "active:bg-zinc-800",
    activeText: "active:text-zinc-400",
    inset: "inset-shadow-xs inset-shadow-zinc-500/50",
    activeInset: "active:inset-shadow-zinc-500/10",
  },
  light: {
    base: "bg-zinc-300",
    text: "text-indigo-600",
    active: "active:bg-zinc-400",
    activeText: "active:text-zinc-800",
    inset: "inset-shadow-xs inset-shadow-zinc-500/50",
    activeInset: "active:inset-shadow-zinc-500/10",
  },
  green: {
    base: "bg-lime-600",
    text: "text-lime-50",
    active: "active:bg-lime-700",
    activeText: "active:text-lime-400",
    inset: "inset-shadow-xs inset-shadow-lime-500/50",
    activeInset: "active:inset-shadow-lime-500/10",
  },
  red: {
    base: "bg-red-600",
    text: "text-red-50",
    active: "active:bg-red-800",
    activeText: "active:text-red-400",
    inset: "inset-shadow-xs inset-shadow-red-500/50",
    activeInset: "active:inset-shadow-red-500/10",
  },
  blue: {
    base: "bg-blue-700",
    text: "text-blue-500",
    active: "active:bg-blue-800",
    activeText: "active:text-blue-400",
    inset: "inset-shadow-xs inset-shadow-blue-500/50",
    activeInset: "active:inset-shadow-blue-700/10",
  },
  yellow: {
    base: "bg-amber-300",
    text: "text-amber-950",
    active: "active:bg-amber-500",
    activeText: "active:text-amber-950",
    inset: "inset-shadow-xs inset-shadow-amber-300/50",
    activeInset: "active:inset-shadow-amber-300/10",
  },
  indigo: {
    base: "bg-indigo-500",
    text: "text-indigo-950",
    active: "active:bg-indigo-600",
    activeText: "active:text-indigo-950",
    inset: "inset-shadow-xs inset-shadow-indigo-400/50",
    activeInset: "active:inset-shadow-indigo-400/10",
  },
  purple: {
    base: "bg-purple-500",
    text: "text-purple-950",
    active: "active:bg-purple-500",
    activeText: "active:text-purple-950",
    inset: "inset-shadow-xs inset-shadow-purple-500/50",
    activeInset: "active:inset-shadow-purple-300/10",
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
  baseColor = "zinc",
  span = 1,
  state,
  className = "",
  disabled = false,
}: ButtonProps) {
  const colors = colorMap[baseColor] || colorMap["zinc"];
  const stateColor = (state && stateColors[state]) || stateColors["default"];

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className={clsx(
        "p-2 rounded-sm cursor-pointer duration-50 transition-ease-in-out",
        `grid ${
          span > 1 ? `col-span-${span}` : ""
        } place-items-center shadow-md shadow-black/50`,
        // Colors
        colors.base,
        colors.text,
        colors.active,
        colors.activeText,
        colors.inset,
        colors.activeInset,
        // State Colors
        stateColor,
        // Disabled
        disabled && "opacity-50 cursor-not-allowed",
        // Custom Class Name
        className
      )}>
      <span className="w-full h-full shadow-md rounded-full grid place-items-center">
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
  baseColor = "zinc",
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
