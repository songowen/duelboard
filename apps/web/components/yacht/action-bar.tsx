import { ReactNode } from "react";
import { PixelButton } from "@/components/yacht/pixel-button";
import { PixelPanel } from "@/components/yacht/pixel-panel";

type ActionButtonConfig = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "cyan" | "amber" | "emerald" | "slate";
  title?: string;
};

type ActionBarProps = {
  primary: ActionButtonConfig;
  secondary?: ActionButtonConfig[];
  status?: ReactNode;
};

export function ActionBar({ primary, secondary = [], status }: ActionBarProps) {
  void status;
  return (
    <PixelPanel tone="slate" className="py-1">
      <div className="flex flex-col items-center gap-2">
        <PixelButton
          tone={primary.tone ?? "amber"}
          onClick={primary.onClick}
          disabled={primary.disabled}
          className="min-w-[240px] border-[4px] border-[#cc8200] px-10 py-3 text-[42px] leading-none tracking-[0.05em] shadow-[0_8px_0_#613100] active:translate-y-[3px] active:shadow-[0_4px_0_#613100] sm:min-w-[360px] sm:px-14 sm:py-4 sm:text-[68px]"
        >
          {primary.label}
        </PixelButton>
        {secondary.length > 0 ? (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {secondary.map((button) => (
              <PixelButton
                key={button.label}
                tone={button.tone ?? "slate"}
                onClick={button.onClick}
                disabled={button.disabled}
                title={button.title}
              >
                {button.label}
              </PixelButton>
            ))}
          </div>
        ) : null}
      </div>
    </PixelPanel>
  );
}
