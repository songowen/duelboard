import type { ReactNode } from "react";
import { GameShell } from "@/components/game-core/layout/GameShell";

type YachtShellProps = {
  top: ReactNode;
  middle: ReactNode;
  bottom: ReactNode;
  className?: string;
};

export function YachtShell({ top, middle, bottom, className }: YachtShellProps) {
  return <GameShell header={top} board={middle} footer={bottom} className={`arcade-space-bg ${className ?? ""}`} />;
}
