import { PixelButton } from "@/components/game-core/ui/PixelButton";

type RollButtonProps = {
  label: string;
  disabled?: boolean;
  onClick: () => void;
};

export function RollButton({ label, disabled, onClick }: RollButtonProps) {
  return (
    <PixelButton
      tone="amber"
      onClick={onClick}
      disabled={disabled}
      className="min-w-[180px] rounded-[10px] border-[4px] border-[#cc8200] px-7 py-2 text-[34px] leading-none tracking-[0.05em] shadow-[0_7px_0_#613100] active:translate-y-[3px] active:shadow-[0_3px_0_#613100] sm:min-w-[230px] sm:px-10 sm:py-3 sm:text-[48px]"
    >
      {label}
    </PixelButton>
  );
}
