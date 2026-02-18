import type { Locale } from "@/lib/i18n";

type LocaleFallbackBadgeProps = {
  requestedLocale: Locale;
  resolvedLocale: Locale;
};

export function LocaleFallbackBadge({ requestedLocale, resolvedLocale }: LocaleFallbackBadgeProps) {
  if (requestedLocale === resolvedLocale) {
    return null;
  }

  const label =
    requestedLocale === "ko"
      ? "한국어 버전은 준비 중입니다. 영어 버전을 표시합니다."
      : "English version is not available yet. Showing Korean version.";

  return (
    <span
      role="status"
      className="inline-flex rounded border border-amber-400/50 bg-amber-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-amber-200"
    >
      {label}
    </span>
  );
}
