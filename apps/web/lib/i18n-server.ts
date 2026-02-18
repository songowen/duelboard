import { cookies, headers } from "next/headers";
import { parseLocale, type Locale, localeCookieName } from "@/lib/i18n";

export async function getRequestLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = parseLocale(cookieStore.get(localeCookieName)?.value);
  if (cookieLocale) {
    return cookieLocale;
  }

  const headerStore = await headers();
  const acceptLanguage = headerStore.get("accept-language")?.toLowerCase() ?? "";
  if (acceptLanguage.includes("ko")) {
    return "ko";
  }

  return "en";
}
