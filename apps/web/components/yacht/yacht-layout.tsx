import { ReactNode } from "react";

type YachtLayoutProps = {
  top: ReactNode;
  middle: ReactNode;
  bottom: ReactNode;
  className?: string;
};

export function YachtLayout({ top, middle, bottom, className = "" }: YachtLayoutProps) {
  return (
    <section
      className={`arcade-space-bg mx-auto flex min-h-[calc(100vh-180px)] w-full max-w-[1320px] flex-col justify-between gap-3 overflow-hidden bg-black px-1 py-1 md:gap-4 lg:gap-5 ${className}`}
    >
      <div className="w-full shrink-0">{top}</div>
      <div className="w-full shrink-0 space-y-3 md:space-y-4">{middle}</div>
      <div className="w-full min-h-0">{bottom}</div>
    </section>
  );
}
