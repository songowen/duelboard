import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { getGameBySlug } from "@/lib/registry";
import { parseLocale, type Locale } from "@/lib/i18n";

export type ContentFrontmatter = {
  title: string;
  description: string;
  date: string;
  slug: string;
  lang: string;
  tags: string[];
  relatedPosts?: string[];
  relatedGames?: string[];
};

export type ContentDoc = ContentFrontmatter & {
  content: string;
  filePath: string;
};

export type LocalizedContentDoc = ContentDoc & {
  requestedLocale: Locale;
  resolvedLocale: Locale;
  fallbackUsed: boolean;
};

export type BlogPost = LocalizedContentDoc;
export type GameDoc = LocalizedContentDoc;
export type PageDoc = LocalizedContentDoc;

const contentRoot = path.join(process.cwd(), "content");
const blogDirectory = path.join(contentRoot, "blog");
const gamesDirectory = path.join(contentRoot, "games");
const pagesDirectory = path.join(contentRoot, "pages");

const FILE_EXTENSIONS = [".mdx", ".md"] as const;

type ContentSection = "blog" | "games" | "pages";

type ParsedFilename = {
  slug: string;
  lang: Locale | null;
};

type RawContentDoc = Omit<ContentDoc, "lang"> & {
  lang: Locale;
};

const SECTION_DIRECTORIES: Record<ContentSection, string> = {
  blog: blogDirectory,
  games: gamesDirectory,
  pages: pagesDirectory,
};

function parseFilename(fileName: string): ParsedFilename {
  const withoutExtension = fileName.replace(/\.(md|mdx)$/i, "");
  const lastDotIndex = withoutExtension.lastIndexOf(".");
  if (lastDotIndex === -1) {
    return { slug: withoutExtension, lang: null };
  }

  const maybeLang = withoutExtension.slice(lastDotIndex + 1);
  const parsedLang = parseLocale(maybeLang);
  if (!parsedLang) {
    return { slug: withoutExtension, lang: null };
  }

  return {
    slug: withoutExtension.slice(0, lastDotIndex),
    lang: parsedLang,
  };
}

function listContentFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory)
    .filter((fileName) => FILE_EXTENSIONS.some((ext) => fileName.endsWith(ext)))
    .sort();
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function parseContentFile(directory: string, fileName: string): RawContentDoc {
  const filePath = path.join(directory, fileName);
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const parsedFilename = parseFilename(fileName);
  const fallbackSlug = parsedFilename.slug;
  const title = typeof data.title === "string" && data.title.trim().length > 0 ? data.title : fallbackSlug;
  const description = typeof data.description === "string" ? data.description : "Duelboard content";
  const date = typeof data.date === "string" ? data.date : "1970-01-01";
  const slug = typeof data.slug === "string" && data.slug.trim().length > 0 ? data.slug : fallbackSlug;
  const frontLang = typeof data.lang === "string" ? parseLocale(data.lang) : null;
  const lang = frontLang ?? parsedFilename.lang ?? "en";
  const tags = normalizeStringArray(data.tags);
  const relatedPosts = normalizeStringArray(data.relatedPosts);
  const relatedGames = normalizeStringArray(data.relatedGames);

  return {
    title,
    description,
    date,
    slug,
    lang,
    tags,
    relatedPosts: relatedPosts.length > 0 ? relatedPosts : undefined,
    relatedGames: relatedGames.length > 0 ? relatedGames : undefined,
    content,
    filePath,
  };
}

function parseAllFromDirectory(directory: string): RawContentDoc[] {
  return listContentFiles(directory).map((fileName) => parseContentFile(directory, fileName));
}

function groupBySlug(section: ContentSection): Map<string, RawContentDoc[]> {
  const allDocs = parseAllFromDirectory(SECTION_DIRECTORIES[section]);
  const grouped = new Map<string, RawContentDoc[]>();

  for (const doc of allDocs) {
    const current = grouped.get(doc.slug) ?? [];
    current.push(doc);
    grouped.set(doc.slug, current);
  }

  return grouped;
}

function resolveLocaleDoc(docs: RawContentDoc[], locale: Locale): LocalizedContentDoc | null {
  if (docs.length === 0) {
    return null;
  }

  const direct = docs.find((doc) => doc.lang === locale);
  if (direct) {
    return {
      ...direct,
      requestedLocale: locale,
      resolvedLocale: locale,
      fallbackUsed: false,
    };
  }

  const fallbackOrder: Locale[] = ["en", "ko"];
  const fallback = fallbackOrder.map((lang) => docs.find((doc) => doc.lang === lang)).find((doc) => doc !== undefined);
  if (!fallback) {
    return null;
  }

  return {
    ...fallback,
    requestedLocale: locale,
    resolvedLocale: fallback.lang,
    fallbackUsed: true,
  };
}

function getLocalizedDoc(section: ContentSection, slug: string, locale: Locale): LocalizedContentDoc | null {
  const grouped = groupBySlug(section);
  const docs = grouped.get(slug);
  if (!docs) {
    return null;
  }
  return resolveLocaleDoc(docs, locale);
}

function getLocalizedDocList(section: ContentSection, locale: Locale): LocalizedContentDoc[] {
  const grouped = groupBySlug(section);
  const docs: LocalizedContentDoc[] = [];

  for (const sectionDocs of grouped.values()) {
    const resolved = resolveLocaleDoc(sectionDocs, locale);
    if (resolved) {
      docs.push(resolved);
    }
  }

  return docs;
}

export function getAllBlogSlugs(): string[] {
  return [...groupBySlug("blog").keys()].sort((a, b) => a.localeCompare(b));
}

export function getAllBlogPosts(locale: Locale): BlogPost[] {
  return getLocalizedDocList("blog", locale).sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getBlogPostBySlug(slug: string, locale: Locale): BlogPost | null {
  return getLocalizedDoc("blog", slug, locale);
}

export function getGameDocBySlug(slug: string, locale: Locale): GameDoc | null {
  return getLocalizedDoc("games", slug, locale);
}

export function getPageDocBySlug(slug: string, locale: Locale): PageDoc | null {
  return getLocalizedDoc("pages", slug, locale);
}

export function getRelatedPosts(relatedSlugs: string[] | undefined, locale: Locale) {
  if (!relatedSlugs || relatedSlugs.length === 0) {
    return [];
  }

  return relatedSlugs
    .map((slug) => getBlogPostBySlug(slug, locale))
    .filter((post): post is BlogPost => post !== null)
    .map((post) => ({
      href: `/blog/${post.slug}`,
      title: post.title,
      fallbackUsed: post.fallbackUsed,
    }));
}

export function getRelatedGames(relatedSlugs: string[] | undefined, locale: Locale) {
  if (!relatedSlugs || relatedSlugs.length === 0) {
    return [];
  }

  return relatedSlugs
    .map((slug) => getGameBySlug(slug))
    .filter((game): game is NonNullable<ReturnType<typeof getGameBySlug>> => game !== null)
    .map((game) => ({ href: game.href, title: game.title[locale] }));
}
