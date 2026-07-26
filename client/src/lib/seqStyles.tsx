export const baseDotStyle =
  "w-4 h-4 rounded-sm border-b inset-shadow-sm ease-in-out duration-100";

// TODO: rename this variable and split up to different variables
export const dotStyles = {
  dotInactive: `${baseDotStyle} bg-neutral-200 border-b-neutral-100`,
  dotActive: `${baseDotStyle} bg-cyan-200 border-b-cyan-100 shadow-cyan-200/50`,
  dotActiveStart: `${baseDotStyle} bg-orange-400 border-b-orange-300 shadow-orange-400/50`,
  input:
    "px-2 py-1 rounded-sm col-start-2 col-end-5 slider shadow-black inset-shadow-sm inset-shadow-black/30",
  label: "font-medium",
  roundButton:
    "bg-neutral-200 p-4 rounded-3xl hover:bg-neutral-300 hover:cursor-pointer hover:shadow-sm active:bg-neutral-100",
};
