import ButtonSmall from "./ButtonSmall";
import ButtonWrapper from "./ButtonWrapper";
import clsx from "clsx";

type BaseColor =
  | "zinc"
  | "green"
  | "red"
  | "blue"
  | "yellow"
  | "indigo"
  | "purple"
  | "light";

const colorMap: Record<
  BaseColor,
  {
    inset: string;
    background: string;
    textColor: string;
    activeBg: string;
    activeText: string;
    activeInset: string;
  }
> = {
  zinc: {
    inset: "inset-shadow-xs inset-shadow-zinc-500/50",
    background: "bg-zinc-700",
    textColor: "text-zinc-500",
    activeBg: "active:bg-zinc-800",
    activeText: "active:text-zinc-400",
    activeInset: "active:inset-shadow-zinc-500/10",
  },
  light: {
    inset: "inset-shadow-xs inset-shadow-zinc-200/50",
    background: "bg-zinc-300",
    textColor: "text-indigo-600",
    activeBg: "active:bg-zinc-400",
    activeText: "active:text-zinc-800",
    activeInset: "active:inset-shadow-zinc-500/10",
  },
  green: {
    inset: "inset-shadow-xs inset-shadow-lime-500/50",
    background: "bg-lime-600",
    textColor: "text-lime-50",
    activeBg: "active:bg-lime-700",
    activeText: "active:text-lime-400",
    activeInset: "active:inset-shadow-lime-500/10",
  },
  red: {
    inset: "inset-shadow-xs inset-shadow-red-500/50",
    background: "bg-red-600",
    textColor: "text-red-50",
    activeBg: "active:bg-red-800",
    activeText: "active:text-red-400",
    activeInset: "active:inset-shadow-red-500/10",
  },
  blue: {
    inset: "inset-shadow-xs inset-shadow-blue-500/50",
    background: "bg-blue-700",
    textColor: "text-blue-500",
    activeBg: "active:bg-blue-800",
    activeText: "active:text-blue-400",
    activeInset: "active:inset-shadow-blue-700/10",
  },
  yellow: {
    inset: "inset-shadow-xs inset-shadow-amber-300/50",
    background: "bg-amber-300",
    textColor: "text-amber-950",
    activeBg: "active:bg-amber-500",
    activeText: "active:text-amber-950",
    activeInset: "active:inset-shadow-amber-300/10",
  },
  indigo: {
    inset: "inset-shadow-xs inset-shadow-indigo-400/50",
    background: "bg-indigo-500",
    textColor: "text-indigo-950",
    activeBg: "active:bg-indigo-600",
    activeText: "active:text-indigo-950",
    activeInset: "active:inset-shadow-indigo-400/10",
  },
  purple: {
    inset: "inset-shadow-xs inset-shadow-purple-500/50",
    background: "bg-purple-500",
    textColor: "text-purple-950",
    activeBg: "active:bg-purple-500",
    activeText: "active:text-purple-950",
    activeInset: "active:inset-shadow-purple-300/10",
  },
};

interface Props {
  text: string | number;
  ariaLabel: string;
  action: () => void;
  itemKey?: string | number;
  baseColor: BaseColor;
  span?: string;
  primaryActive: boolean;
  secondaryActive?: boolean;
  tertiaryActive?: boolean;
  styles?: string;
  children?: React.ReactNode;
}

export default function Button({
  text,
  ariaLabel,
  action,
  itemKey,
  baseColor,
  span,
  primaryActive,
  secondaryActive,
  tertiaryActive,
  children,
}: Props) {
  const colors = colorMap[baseColor] || colorMap["zinc"];
  const wrapperClass = clsx(
    "cursor-pointer duration-50",
    colors.inset,
    colors.activeInset,
    colors.background,
    colors.textColor,
    colors.activeBg,
    span
  );

  const buttonClass = clsx(
    "active:shadow-black/20 shadow-md shadow-black/50  transition-ease-in-out",
    colors.inset,
    colors.activeInset,
    colors.activeText
  );

  return (
    <>
      <ButtonWrapper
        classNames={wrapperClass}
        action={action}
        ariaLabel={ariaLabel}
        itemKey={itemKey}>
        <ButtonSmall
          text={text}
          classNames={buttonClass}
          primaryActive={primaryActive}
          secondaryActive={secondaryActive}
          tertiaryActive={tertiaryActive}>
          {children}
        </ButtonSmall>
      </ButtonWrapper>
    </>
  );
}
