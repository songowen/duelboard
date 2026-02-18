#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";

function sanitizeSlug(input) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function copyDir(sourceDir, targetDir) {
  await fs.mkdir(targetDir, { recursive: true });
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await copyDir(sourcePath, targetPath);
      continue;
    }

    await fs.copyFile(sourcePath, targetPath);
  }
}

async function rewriteTemplateImports(targetDir, slug, titleEn) {
  const replacements = [
    ["components/games/_template", `components/games/${slug}`],
    ["NEW GAME", titleEn.toUpperCase()],
  ];

  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }

      if (!entry.name.endsWith(".ts") && !entry.name.endsWith(".tsx")) {
        continue;
      }

      let content = await fs.readFile(absolutePath, "utf8");
      for (const [from, to] of replacements) {
        content = content.replaceAll(from, to);
      }
      await fs.writeFile(absolutePath, content, "utf8");
    }
  }

  await walk(targetDir);
}

function buildModePage({ slug, mode }) {
  const modeLabel = mode === "vs-ai" ? "VS AI" : "ONLINE";
  const canonical = `/games/${slug}/${mode}`;

  return `import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GameComingSoon } from "@/components/game-core/layout/GameComingSoon";
import { getRequestLocale } from "@/lib/i18n-server";
import { getGameBySlug } from "@/lib/registry";

export const metadata: Metadata = {
  title: "${slug} ${modeLabel}",
  description: "${slug} ${modeLabel} scaffold page.",
  alternates: { canonical: "${canonical}" },
};

export default async function ${slug
    .split("-")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join("")}${mode === "vs-ai" ? "VsAi" : "Online"}Page() {
  const locale = await getRequestLocale();
  const game = getGameBySlug("${slug}");
  if (!game) {
    notFound();
  }

  const title = game.title[locale];
  const comingSoon = locale === "ko" ? "출시 예정" : "Coming Soon";

  if (game.status !== "live") {
    return (
      <section className="rounded-xl border border-slate-700 bg-slate-900/70 p-6">
        <h1 className="mb-3 text-xs uppercase tracking-[0.16em] text-cyan-200">
          {title} ${modeLabel} ({comingSoon})
        </h1>
        <GameComingSoon title={comingSoon} description={game.description?.[locale] ?? ""} />
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/70 p-6">
      <h1 className="mb-3 text-xs uppercase tracking-[0.16em] text-cyan-200">{title} ${modeLabel}</h1>
      <GameComingSoon title={title} description={game.description?.[locale] ?? ""} />
    </section>
  );
}
`;
}

function buildMainPage({ slug, titleEn }) {
  const pageName = slug
    .split("-")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join("");

  return `import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CartridgeButton } from "@/components/home/cartridge-button";
import { GameComingSoon } from "@/components/game-core/layout/GameComingSoon";
import type { GameMode } from "@/lib/registry";
import { getRequestLocale } from "@/lib/i18n-server";
import { getGameBySlug, getGameModeHref } from "@/lib/registry";

export const metadata: Metadata = {
  title: "${titleEn}",
  description: "${titleEn} mode select scaffold.",
  alternates: { canonical: "/games/${slug}" },
};

export default async function ${pageName}ModePage() {
  const locale = await getRequestLocale();
  const game = getGameBySlug("${slug}");
  if (!game) {
    notFound();
  }

  const modeLabelByLocale: Record<GameMode, string> = {
    "vs-ai": locale === "ko" ? "AI 대전" : "VS AI",
    online: locale === "ko" ? "온라인 1:1" : "ONLINE 1V1",
  };

  const modeToneByMode: Record<GameMode, "yellow" | "red"> = {
    "vs-ai": "yellow",
    online: "red",
  };

  const modeSelect = locale === "ko" ? "모드 선택" : "Mode Select";
  const description = game.description?.[locale] ?? "";
  const comingSoon = locale === "ko" ? "출시 예정" : "Coming Soon";
  const live = game.status === "live";

  return (
    <section className="grid min-h-[clamp(420px,72vh,760px)] place-items-center">
      <div className="w-full max-w-3xl border border-cyan-300/45 bg-black/80 p-5 sm:p-8">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300">{modeSelect}</p>
          <h1 className="mt-3 text-4xl uppercase tracking-[0.12em] text-[#f5f5f5] sm:text-5xl">{game.title[locale]}</h1>
          <p className="mt-3 text-[11px] text-slate-300">{description}</p>
        </div>

        <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-6">
          {game.modes.map((mode) => (
            <CartridgeButton
              key={mode}
              href={live ? getGameModeHref(game.slug, mode) : undefined}
              tone={modeToneByMode[mode]}
              className={live ? "w-full" : "w-full cursor-not-allowed opacity-70"}
              disabled={!live}
              aria-disabled={!live}
            >
              {modeLabelByLocale[mode]} {live ? "" : "(" + comingSoon + ")"}
            </CartridgeButton>
          ))}
        </div>

        <div className="mt-6">
          <GameComingSoon title={comingSoon} description={description} />
        </div>
      </div>
    </section>
  );
}
`;
}

function buildRegistryEntry({ slug, titleEn, titleKo }) {
  const safeEn = titleEn.replace(/"/g, '\\"');
  const safeKo = titleKo.replace(/"/g, '\\"');

  return `  {
    slug: "${slug}",
    title: {
      en: "${safeEn}",
      ko: "${safeKo}",
    },
    description: {
      en: "${safeEn} is under development and will be available soon.",
      ko: "${safeKo}은(는) 현재 개발 중이며 곧 공개될 예정입니다.",
    },
    href: "/games/${slug}",
    imageSrc: "/${slug}.gif",
    tone: "yellow",
    modes: ["vs-ai", "online"],
    status: "coming-soon",
  },
`;
}

async function appendRegistryEntry({ root, slug, titleEn, titleKo }) {
  const registryPath = path.join(root, "lib", "registry.ts");
  const source = await fs.readFile(registryPath, "utf8");

  if (source.includes(`slug: "${slug}"`)) {
    throw new Error(`Registry already contains slug \"${slug}\".`);
  }

  const marker = "] as const satisfies readonly GameMeta[];";
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error("Failed to update registry.ts: array marker not found.");
  }

  const entry = buildRegistryEntry({ slug, titleEn, titleKo });
  const next = `${source.slice(0, markerIndex)}${entry}${source.slice(markerIndex)}`;
  await fs.writeFile(registryPath, next, "utf8");
}

async function main() {
  const [, , rawSlug, rawTitleEn, rawTitleKo] = process.argv;

  if (!rawSlug || !rawTitleEn || !rawTitleKo) {
    console.error('Usage: pnpm scaffold:game <slug> "English Title" "Korean Title"');
    process.exit(1);
  }

  const slug = sanitizeSlug(rawSlug);
  const titleEn = rawTitleEn.trim();
  const titleKo = rawTitleKo.trim();

  if (!slug) {
    console.error("Invalid slug.");
    process.exit(1);
  }

  const root = process.cwd();
  const templateDir = path.join(root, "components", "games", "_template");
  const gameComponentsDir = path.join(root, "components", "games", slug);
  const gameRouteDir = path.join(root, "app", "games", slug);

  if (!(await exists(templateDir))) {
    throw new Error(`Template directory not found: ${templateDir}`);
  }

  if (await exists(gameComponentsDir)) {
    throw new Error(`Target game component path already exists: ${gameComponentsDir}`);
  }

  if (await exists(gameRouteDir)) {
    throw new Error(`Target route path already exists: ${gameRouteDir}`);
  }

  await copyDir(templateDir, gameComponentsDir);
  await rewriteTemplateImports(gameComponentsDir, slug, titleEn);

  await fs.mkdir(path.join(gameRouteDir, "vs-ai"), { recursive: true });
  await fs.mkdir(path.join(gameRouteDir, "online"), { recursive: true });

  await fs.writeFile(path.join(gameRouteDir, "page.tsx"), buildMainPage({ slug, titleEn }), "utf8");
  await fs.writeFile(path.join(gameRouteDir, "vs-ai", "page.tsx"), buildModePage({ slug, mode: "vs-ai" }), "utf8");
  await fs.writeFile(path.join(gameRouteDir, "online", "page.tsx"), buildModePage({ slug, mode: "online" }), "utf8");

  await appendRegistryEntry({ root, slug, titleEn, titleKo });

  console.log(`Scaffold created: ${slug}`);
  console.log(`- components: ${path.relative(root, gameComponentsDir)}`);
  console.log(`- routes: ${path.relative(root, gameRouteDir)}`);
  console.log("- registry entry added to lib/registry.ts with status=coming-soon");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
