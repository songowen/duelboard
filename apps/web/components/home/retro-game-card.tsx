import Image from "next/image";
import Link from "next/link";
import { CartridgeButton } from "@/components/home/cartridge-button";

type RetroGameCardProps = {
  title: string;
  summary: string;
  href?: string;
  imageSrc: string;
  tone: "yellow" | "red";
  comingSoon?: boolean;
  playLabel: string;
  comingSoonLabel: string;
  openGameImageAria: string;
  comingSoonImageAria: string;
};

export function RetroGameCard({
  title,
  summary,
  href,
  imageSrc,
  tone,
  comingSoon = false,
  playLabel,
  comingSoonLabel,
  openGameImageAria,
  comingSoonImageAria,
}: RetroGameCardProps) {
  const imageNode = (
    <Image
      src={imageSrc}
      alt={`${title} thumbnail`}
      width={220}
      height={220}
      className="h-auto w-full object-cover [image-rendering:pixelated]"
    />
  );

  return (
    <article className="mx-auto flex w-full max-w-[280px] flex-col items-center gap-3 text-center">
      {comingSoon ? (
        <div aria-label={comingSoonImageAria} className="w-full">
          {imageNode}
        </div>
      ) : (
        <Link
          href={href ?? "/games"}
          aria-label={`${openGameImageAria}: ${title}`}
          className="block w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5f5f5]"
        >
          {imageNode}
        </Link>
      )}
      <div className="flex items-center gap-2">
        <h3 className="text-2xl uppercase tracking-[0.08em] text-[#f5f5f5]">{title}</h3>
      </div>
      <p className="text-sm leading-6 text-[#c7c7c7]">{summary}</p>
      {comingSoon ? (
        <CartridgeButton
          tone={tone}
          className="mt-1 w-full cursor-not-allowed opacity-75 disabled:pointer-events-none disabled:cursor-not-allowed"
          aria-label={`${title} ${comingSoonLabel}`}
          aria-disabled="true"
          disabled
        >
          {comingSoonLabel}
        </CartridgeButton>
      ) : (
        <CartridgeButton href={href ?? "/games"} tone={tone} hoverArrow className="mt-1 w-full" aria-label={`${title} ${playLabel}`}>
          {playLabel}
        </CartridgeButton>
      )}
    </article>
  );
}
