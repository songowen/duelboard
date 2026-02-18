import { PixelButton } from "@/components/game-core/ui/PixelButton";

type DifficultySelectProps = {
  label: string;
  disabled?: boolean;
};

export function DifficultySelect({ label, disabled = true }: DifficultySelectProps) {
  return (
    <PixelButton tone="slate" disabled={disabled} title={label}>
      {label}
    </PixelButton>
  );
}
