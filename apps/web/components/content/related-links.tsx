import Link from "next/link";
import type { Locale } from "@/lib/i18n";

type RelatedLink = {
  href: string;
  title: string;
};

type RelatedLinksProps = {
  locale: Locale;
  posts?: RelatedLink[];
  games?: RelatedLink[];
};

export function RelatedLinks({ locale, posts = [], games = [] }: RelatedLinksProps) {
  if (posts.length === 0 && games.length === 0) {
    return null;
  }

  const labels = {
    title: locale === "ko" ? "관련 링크" : "Related Links",
    posts: locale === "ko" ? "관련 글" : "Related Posts",
    games: locale === "ko" ? "관련 게임" : "Related Games",
  };

  return (
    <aside className="rounded-xl border border-slate-700 bg-slate-950/80 p-5">
      <h2 className="text-xs uppercase tracking-[0.16em] text-cyan-200">{labels.title}</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-slate-300">{labels.posts}</p>
          {posts.length === 0 ? (
            <p className="mt-2 text-[12px] text-slate-500">-</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {posts.map((post) => (
                <li key={post.href}>
                  <Link href={post.href} className="text-[12px] text-cyan-200 hover:text-cyan-100">
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.12em] text-slate-300">{labels.games}</p>
          {games.length === 0 ? (
            <p className="mt-2 text-[12px] text-slate-500">-</p>
          ) : (
            <ul className="mt-2 space-y-1">
              {games.map((game) => (
                <li key={game.href}>
                  <Link href={game.href} className="text-[12px] text-cyan-200 hover:text-cyan-100">
                    {game.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}
