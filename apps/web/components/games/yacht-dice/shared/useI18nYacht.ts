import { useMemo } from "react";
import type { Locale } from "@/lib/i18n";
import { YACHT_CATEGORY_DESCRIPTIONS, YACHT_CATEGORY_LABELS } from "@/lib/games/yacht-dice/categories";

export function useI18nYacht(locale: Locale) {
  const labels = useMemo(() => YACHT_CATEGORY_LABELS[locale], [locale]);
  const descriptions = useMemo(() => YACHT_CATEGORY_DESCRIPTIONS[locale], [locale]);
  return { labels, descriptions };
}
