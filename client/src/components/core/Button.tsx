import { Pause, Play } from "phosphor-react";

interface ButtonProps {
  children?: React.ReactNode;
  text?: string;
  onClick: () => void;
  ariaLabel: string;
  className?: string;
  showIndicator?: boolean;
  isCurrent?: boolean;
  isActive?: boolean;
}

export default function Button({
  children,
  text = "",
  onClick,
  ariaLabel,
  className,
  showIndicator,
  isCurrent,
  isActive,
}: ButtonProps) {
  let indicatorClass = "button-indicator";
  if (isActive && isCurrent) indicatorClass += " indicator-active-current";
  else if (isActive) indicatorClass += " indicator-active";
  else if (isCurrent) indicatorClass += " indicator-current";

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`seq-button ${className}`}>
      <span className="inner-button-bottom-shadow">
        <span className="inner-button-top-shadow button-text">
          <span className="">
            {" "}
            {text} {children}
            {showIndicator && (
              <span className={indicatorClass} aria-hidden="true" />
            )}
          </span>
        </span>
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
    ariaLabel={isPlaying ? "Stop Playback" : "Start Playback"}>
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
    className={`track-select-button button-indigo "button-neutral"
    }`}
    showIndicator
    isCurrent={false}
    isActive={isActive}
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
    className="button-light"
    showIndicator
    isCurrent={isCurrent}
    isActive={isActive}
  />
);

export const UtilityButton = ({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) => (
  <Button onClick={onClick} ariaLabel={label}>
    {icon}
  </Button>
);
