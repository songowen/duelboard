export type GameStatus = "live" | "coming-soon";

export type GameMode = "vs-ai" | "online";

export type LocalizedText = {
  en: string;
  ko: string;
};

export interface GameMeta {
  slug: string;
  title: LocalizedText;
  description?: LocalizedText;
  href: `/games/${string}`;
  imageSrc?: string;
  heroImage?: string;
  tone?: "yellow" | "red";
  modes: readonly GameMode[];
  status: GameStatus;
}

export const gameRegistry = [
  {
    slug: "yacht-dice",
    title: {
      en: "Yacht Dice",
      ko: "요트 다이스",
    },
    description: {
      en: "Roll, hold, and outscore the rival in quick retro rounds.",
      ko: "굴리고, 홀드하고, 빠른 레트로 라운드에서 상대를 이겨보세요.",
    },
    href: "/games/yacht-dice",
    imageSrc: "/yacht-dice.gif",
    tone: "yellow",
    modes: ["vs-ai", "online"],
    status: "live",
  },
  {
    slug: "sea-battle",
    title: {
      en: "Sea Battle",
      ko: "씨 배틀",
    },
    description: {
      en: "Sea Battle is under development and will be available soon.",
      ko: "Sea Battle은 현재 개발 중이며 곧 공개될 예정입니다.",
    },
    href: "/games/sea-battle",
    imageSrc: "/sea-battle.gif",
    tone: "red",
    modes: ["vs-ai", "online"],
    status: "coming-soon",
  },
] as const satisfies readonly GameMeta[];

export function getGameBySlug(slug: string) {
  return gameRegistry.find((game) => game.slug === slug) ?? null;
}

export function getGameModeHref(slug: string, mode: GameMode) {
  return `/games/${slug}/${mode}` as const;
}
