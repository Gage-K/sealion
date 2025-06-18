interface Props {
  text: string | number;
  key?: string | number;
  classNames: string;
  primaryActive: boolean;
  secondaryActive?: boolean;
  tertiaryActive?: boolean;
  styles?: string;
  children?: React.ReactNode;
}

export default function ButtonSmall({
  text,
  classNames,
  primaryActive,
  secondaryActive,
  tertiaryActive,
  children,
}: Props) {
  const primaryColor = "text-zinc-50";
  const secondaryColor = "text-green-500";
  const tertiaryColor = "text-amber-500";
  const color = tertiaryActive
    ? tertiaryColor
    : secondaryActive
    ? secondaryColor
    : primaryActive
    ? primaryColor
    : "";

  return (
    <span
      className={`${classNames} ${color} w-full h-full shadow-md rounded-full grid place-items-center button-inner`}>
      {text} {children}
    </span>
  );
}
