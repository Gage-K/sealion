interface ButtonWrapperProps {
  children: React.ReactNode;
  itemKey?: string | number;
  classNames: string;
  ariaLabel: string;

  action: () => void;
}
export default function ButtonWrapper({
  children,
  itemKey,
  classNames,
  action,
  ariaLabel,
}: ButtonWrapperProps) {
  return (
    <button
      className={`step-container p-2 ${classNames} grid place-items-center rounded-sm`}
      key={itemKey}
      onClick={action}
      aria-label={ariaLabel}>
      {children}
    </button>
  );
}
