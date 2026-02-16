import Image from "next/image";
import { CartridgeButton } from "@/components/home/cartridge-button";

type RetroGameCardProps = {
  title: string;
  summary: string;
  href?: string;
  imageSrc: string;
  tone: "yellow" | "red";
  comingSoon?: boolean;
};

export function RetroGameCard({ title, summary, href, imageSrc, tone, comingSoon = false }: RetroGameCardProps) {
  return (
    <article className="mx-auto flex w-full max-w-[280px] flex-col items-center gap-3 text-center">
      <Image
        src={imageSrc}
        alt={`${title} thumbnail`}
        width={220}
        height={220}
        className="h-auto w-full object-cover [image-rendering:pixelated]"
      />
      <div className="flex items-center gap-2">
        <h3 className="text-2xl uppercase tracking-[0.08em] text-[#f5f5f5]">{title}</h3>
      </div>
      <p className="text-sm leading-6 text-[#c7c7c7]">{summary}</p>
      {comingSoon ? (
        <CartridgeButton
          tone={tone}
          className="mt-1 w-full cursor-not-allowed opacity-75 disabled:pointer-events-none disabled:cursor-not-allowed"
          aria-label={`${title} coming soon`}
          aria-disabled="true"
          disabled
        >
          Coming Soon
        </CartridgeButton>
      ) : (
        <CartridgeButton href={href ?? "/games"} tone={tone} hoverArrow className="mt-1 w-full" aria-label={`${title} play`}>
          Play
        </CartridgeButton>
      )}
    </article>
  );
}
