"use client";

import { Tooltip } from "@/components/game-core/ui/Tooltip";

type CategoryHintProps = {
  label: string;
  description: string;
  open: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onClose: () => void;
};

export function CategoryHint({ label, description, open, onToggle, onOpen, onClose }: CategoryHintProps) {
  return (
    <span
      className="group/info relative inline-flex h-[14px] w-[14px] shrink-0 cursor-help items-center justify-center rounded-full border border-[#9d914f]/80 text-[9px] leading-none text-slate-200 sm:h-[16px] sm:w-[16px] sm:text-[10px]"
      aria-label={`${label}: ${description}`}
      onMouseDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      }}
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
      onFocus={onOpen}
      onBlur={onClose}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          onToggle();
        }
      }}
      role="button"
      tabIndex={0}
      aria-expanded={open}
    >
      !
      <Tooltip key={`${label}-${description}`} content={`${label}: ${description}`} open={open} />
    </span>
  );
}
