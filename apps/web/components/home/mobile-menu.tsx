"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";

type MobileMenuProps = {
  labels: {
    games: string;
    blog: string;
    more: string;
  };
};

type NavItem = {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
};

const mobileLinkClass = [
  "relative inline-flex items-center pb-[4px] text-2xl uppercase tracking-[0.06em] text-[#f5f5f5] transition-colors duration-150 motion-reduce:transition-none",
  "before:inline-block before:w-[1ch] before:content-['>'] before:text-[#f6d32d] before:opacity-0",
  "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#f6d32d] after:opacity-0",
  "hover:text-[#f6d32d] hover:before:opacity-100 hover:after:opacity-100",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5f5f5]",
  "data-[active=true]:text-[#f6d32d] data-[active=true]:before:opacity-100 data-[active=true]:after:opacity-100",
].join(" ");

export function MobileMenu({ labels }: MobileMenuProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const navItems: NavItem[] = [
    {
      href: "/#games",
      label: labels.games,
      match: (currentPathname) => currentPathname.startsWith("/games"),
    },
    {
      href: "/blog",
      label: labels.blog,
      match: (currentPathname) => currentPathname.startsWith("/blog"),
    },
    {
      href: "/about",
      label: labels.more,
      match: (currentPathname) => currentPathname.startsWith("/about"),
    },
  ];

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-10 w-10 items-center justify-center rounded border border-[#f5f5f5]/45 text-[#f5f5f5] hover:text-[#f6d32d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5f5f5]"
      >
        <span className="sr-only">Open menu</span>
        <span className="flex h-4 w-5 flex-col justify-between">
          <span className="h-[2px] w-full bg-current" />
          <span className="h-[2px] w-full bg-current" />
          <span className="h-[2px] w-full bg-current" />
        </span>
      </button>

      <div
        className={`fixed inset-0 z-50 bg-black/65 transition-opacity duration-200 motion-reduce:transition-none ${open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      >
        <div
          id={panelId}
          role="dialog"
          aria-modal="true"
          className={`absolute right-0 top-0 h-full w-[min(84vw,320px)] border-l border-[#f5f5f5]/25 bg-black px-5 py-5 transition-transform duration-200 motion-reduce:transition-none ${open ? "translate-x-0" : "translate-x-full"}`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-5 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.14em] text-[#f6d32d]">Menu</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded border border-[#f5f5f5]/35 text-[#f5f5f5] hover:text-[#f6d32d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5f5f5]"
            >
              <span aria-hidden="true" className="text-lg leading-none">
                ×
              </span>
              <span className="sr-only">Close menu</span>
            </button>
          </div>

          <nav aria-label="Primary">
            <ul className="space-y-4">
              {navItems.map((item) => {
                const isActive = item.match(pathname);
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      aria-label={item.label}
                      data-active={isActive ? "true" : "false"}
                      aria-current={isActive ? "page" : undefined}
                      className={mobileLinkClass}
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
