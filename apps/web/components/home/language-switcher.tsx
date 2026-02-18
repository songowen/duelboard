"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { localeCookieName, type Locale } from "@/lib/i18n";

type LanguageSwitcherProps = {
  locale: Locale;
};

const options: { locale: Locale; label: string; flagSrc: string; flagAlt: string }[] = [
  { locale: "ko", label: "한국어", flagSrc: "/flags/kr.png", flagAlt: "Korean flag" },
  { locale: "en", label: "English", flagSrc: "/flags/us.png", flagAlt: "US flag" },
];

export function LanguageSwitcher({ locale }: LanguageSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const selected = useMemo(
    () => options.find((option) => option.locale === locale) ?? options[0],
    [locale],
  );
  const selectedIndex = useMemo(
    () => options.findIndex((option) => option.locale === selected.locale),
    [selected.locale],
  );

  const onSelect = (nextLocale: Locale) => {
    setOpen(false);
    if (nextLocale === locale) return;
    document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    setFocusedIndex(selectedIndex);
    optionRefs.current[selectedIndex]?.focus();
  }, [open, selectedIndex]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const moveFocus = (nextIndex: number) => {
    const normalized = (nextIndex + options.length) % options.length;
    setFocusedIndex(normalized);
    optionRefs.current[normalized]?.focus();
  };

  const onMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveFocus(focusedIndex < 0 ? selectedIndex + 1 : focusedIndex + 1);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveFocus(focusedIndex < 0 ? selectedIndex - 1 : focusedIndex - 1);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      moveFocus(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      moveFocus(options.length - 1);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const index = focusedIndex < 0 ? selectedIndex : focusedIndex;
      onSelect(options[index].locale);
    }
  };

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Select language"
        onClick={() => setOpen((current) => !current)}
        className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-black text-[#f5f5f5] ring-1 ring-[#f5f5f5]/45 transition hover:ring-[#f6d32d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5f5f5]"
      >
        <Image
          src={selected.flagSrc}
          alt={selected.flagAlt}
          fill
          sizes="40px"
          className="scale-[1.28] object-cover object-center"
          priority
        />
        <span className="sr-only">Select language</span>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Language"
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 z-50 mt-2 min-w-[150px] rounded-2xl border border-[#f6d32d]/70 bg-black/95 p-1.5 shadow-[0_10px_22px_rgba(0,0,0,0.55)]"
        >
          {options.map((option, index) => {
            const active = option.locale === locale;
            return (
              <button
                key={option.locale}
                ref={(element) => {
                  optionRefs.current[index] = element;
                }}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => onSelect(option.locale)}
                onFocus={() => setFocusedIndex(index)}
                className={`flex w-full items-center justify-between gap-2 rounded-xl px-2 py-2 text-left text-xs tracking-[0.05em] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#f5f5f5] ${
                  active ? "bg-[#f6d32d] text-black" : "text-[#f5f5f5] hover:bg-[#f6d32d]/15 hover:text-[#f6d32d]"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <span className="relative h-5 w-5 overflow-hidden rounded-full ring-1 ring-[#f5f5f5]/40">
                    <Image
                      src={option.flagSrc}
                      alt={option.flagAlt}
                      fill
                      sizes="20px"
                      className="scale-[1.28] object-cover object-center"
                    />
                  </span>
                  <span>{option.label}</span>
                </span>
                <span className="w-3 text-right">{active ? "✓" : ""}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
