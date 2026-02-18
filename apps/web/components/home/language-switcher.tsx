"use client";

import { useRouter } from "next/navigation";
import { localeCookieName, type Locale } from "@/lib/i18n";

type LanguageSwitcherProps = {
  locale: Locale;
};

const options: { locale: Locale; label: string }[] = [
  { locale: "en", label: "US" },
  { locale: "ko", label: "KR" },
];

export function LanguageSwitcher({ locale }: LanguageSwitcherProps) {
  const router = useRouter();

  const onSelect = (nextLocale: Locale) => {
    if (nextLocale === locale) return;
    document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };

  return (
    <div className="inline-flex items-center gap-1 rounded border border-[#f5f5f5]/45 px-1 py-1">
      {options.map((option) => {
        const active = option.locale === locale;
        return (
          <button
            key={option.locale}
            type="button"
            onClick={() => onSelect(option.locale)}
            aria-pressed={active}
            className={`min-w-10 px-2 py-1 text-xs uppercase tracking-[0.08em] transition ${
              active ? "bg-[#f6d32d] text-black" : "text-[#f5f5f5] hover:text-[#f6d32d]"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
