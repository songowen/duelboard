import type { ButtonHTMLAttributes, ReactNode } from "react";

type PixelButtonTone = "cyan" | "amber" | "emerald" | "slate";

const BUTTON_TONE_CLASS: Record<PixelButtonTone, string> = {
  cyan: "bg-[#39b9d6] text-[#041721]",
  amber: "bg-[#f6d32d] text-[#3b0900]",
  emerald: "bg-[#4ed39e] text-[#08271b]",
  slate: "bg-[#343943] text-[#e2e8f0]",
};

type PixelButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children: ReactNode;
  tone?: PixelButtonTone;
  fullWidth?: boolean;
};

export function PixelButton({ children, tone = "slate", className = "", fullWidth = false, ...buttonProps }: PixelButtonProps) {
  return (
    <button
      type="button"
      className={`relative px-4 py-2 text-[10px] uppercase tracking-[0.1em] ${BUTTON_TONE_CLASS[tone]} ${
        fullWidth ? "w-full" : ""
      } shadow-[0_4px_0_rgba(22,22,22,0.92)] active:translate-y-[2px] active:shadow-[0_2px_0_rgba(22,22,22,0.92)] motion-safe:transition-[transform,box-shadow,filter,opacity] motion-reduce:transition-none motion-reduce:transform-none hover:brightness-105 disabled:cursor-not-allowed disabled:bg-[#3a3a3a] disabled:text-[#7a7a7a] disabled:shadow-none disabled:opacity-55 ${className}`}
      {...buttonProps}
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/28" />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-black/45" />
      <span className="relative">{children}</span>
    </button>
  );
}
