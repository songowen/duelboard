"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
};

const navItems: NavItem[] = [
  {
    href: "/#games",
    label: "Games",
    match: (pathname) => pathname.startsWith("/games"),
  },
  {
    href: "/blog",
    label: "Blog",
    match: (pathname) => pathname.startsWith("/blog"),
  },
  {
    href: "/about",
    label: "More",
    match: (pathname) => pathname.startsWith("/about"),
  },
];

const navLinkClass = [
  "relative inline-flex items-center pb-[4px] text-[#f5f5f5] transition-colors duration-150 motion-reduce:transition-none",
  "before:inline-block before:w-[1ch] before:content-['>'] before:text-[#f6d32d] before:opacity-0",
  "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#f6d32d] after:opacity-0",
  "hover:text-[#f6d32d] hover:before:opacity-100 hover:after:opacity-100",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5f5f5]",
  "data-[active=true]:text-[#f6d32d] data-[active=true]:before:opacity-100 data-[active=true]:after:opacity-100",
].join(" ");

export function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary">
      <ul className="flex items-center gap-5 text-2xl uppercase tracking-[0.06em] sm:gap-8">
        {navItems.map((item) => {
          const isActive = item.match(pathname);
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                aria-label={item.label}
                data-active={isActive ? "true" : "false"}
                aria-current={isActive ? "page" : undefined}
                className={navLinkClass}
              >
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
