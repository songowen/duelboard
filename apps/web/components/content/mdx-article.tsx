import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { AnchorHTMLAttributes, HTMLAttributes, LiHTMLAttributes } from "react";

type MdxArticleProps = {
  source: string;
};

const components = {
  h1: (props: HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="mt-8 text-2xl uppercase tracking-[0.08em] text-[#f5f5f5]" {...props} />
  ),
  h2: (props: HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="mt-7 text-xl uppercase tracking-[0.08em] text-[#f6d32d]" {...props} />
  ),
  h3: (props: HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="mt-6 text-lg uppercase tracking-[0.06em] text-cyan-200" {...props} />
  ),
  p: (props: HTMLAttributes<HTMLParagraphElement>) => <p className="mt-3 text-[13px] leading-7 text-slate-200" {...props} />,
  ul: (props: HTMLAttributes<HTMLUListElement>) => <ul className="mt-3 list-disc space-y-2 pl-6 text-[13px] leading-7 text-slate-200" {...props} />,
  ol: (props: HTMLAttributes<HTMLOListElement>) => (
    <ol className="mt-3 list-decimal space-y-2 pl-6 text-[13px] leading-7 text-slate-200" {...props} />
  ),
  li: (props: LiHTMLAttributes<HTMLLIElement>) => <li className="text-[13px] leading-7" {...props} />,
  blockquote: (props: HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote className="mt-4 border-l-2 border-[#f6d32d] pl-4 text-[13px] leading-7 text-slate-300" {...props} />
  ),
  hr: (props: HTMLAttributes<HTMLHRElement>) => <hr className="my-8 border-slate-700" {...props} />,
  a: ({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => {
    if (href && href.startsWith("/")) {
      return <Link href={href} className="text-cyan-200 underline decoration-cyan-500 underline-offset-2 hover:text-cyan-100" {...props} />;
    }

    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="text-cyan-200 underline decoration-cyan-500 underline-offset-2 hover:text-cyan-100"
        {...props}
      />
    );
  },
  strong: (props: HTMLAttributes<HTMLElement>) => <strong className="font-semibold text-[#f5f5f5]" {...props} />,
  code: (props: HTMLAttributes<HTMLElement>) => <code className="rounded bg-slate-900 px-1 py-0.5 text-[12px] text-amber-200" {...props} />,
};

export function MdxArticle({ source }: MdxArticleProps) {
  return (
    <div className="space-y-1">
      <MDXRemote source={source} components={components} />
    </div>
  );
}
