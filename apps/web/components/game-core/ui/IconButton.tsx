import type { ButtonHTMLAttributes, ReactNode } from "react";

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  icon: ReactNode;
  srLabel: string;
};

export function IconButton({ icon, srLabel, className = "", ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={srLabel}
      className={`inline-flex h-8 w-8 items-center justify-center rounded border border-[#f5f5f5]/35 text-[#f5f5f5] hover:text-[#f6d32d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5f5f5] ${className}`}
      {...props}
    >
      <span aria-hidden="true">{icon}</span>
      <span className="sr-only">{srLabel}</span>
    </button>
  );
}
