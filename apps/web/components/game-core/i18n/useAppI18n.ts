"use client";

import { useMemo } from "react";
import { getMessages, type Locale } from "@/lib/i18n";

export function useAppI18n(locale: Locale) {
  return useMemo(() => getMessages(locale), [locale]);
}
