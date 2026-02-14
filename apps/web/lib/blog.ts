import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

const blogDirectory = path.join(process.cwd(), "content", "blog");

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  html: string;
};

type BlogFrontmatter = {
  title?: string;
  description?: string;
  date?: string;
};

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(blogDirectory)) {
    return [];
  }

  const files = fs.readdirSync(blogDirectory).filter((file) => file.endsWith(".md"));

  return files
    .map((file) => getPostBySlug(file.replace(/\.md$/, "")))
    .filter((post): post is BlogPost => post !== null)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug: string): BlogPost | null {
  const fullPath = path.join(blogDirectory, `${slug}.md`);
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);
  const frontmatter = data as BlogFrontmatter;

  return {
    slug,
    title: frontmatter.title ?? slug,
    description: frontmatter.description ?? "Duelboard blog post",
    date: frontmatter.date ?? "1970-01-01",
    html: marked.parse(content, { async: false }) as string,
  };
}
