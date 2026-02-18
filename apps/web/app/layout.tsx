import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { HeaderNav } from "@/components/home/header-nav";
import { LanguageSwitcher } from "@/components/home/language-switcher";
import { MobileMenu } from "@/components/home/mobile-menu";
import { getMessages } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n-server";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://duelboard.gg";
const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Duelboard",
    template: "%s | Duelboard",
  },
  description: "Retro-style duel game portal with quick browser games and updates.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Duelboard",
    description: "Retro-style duel game portal with quick browser games and updates.",
    url: "/",
    siteName: "Duelboard",
    type: "website",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Duelboard",
    description: "Retro-style duel game portal with quick browser games and updates.",
    images: ["/opengraph-image"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getRequestLocale();
  const t = getMessages(locale);

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-black text-[#f5f5f5]">
        {adsenseClient ? (
          <>
            <meta name="google-adsense-account" content={adsenseClient} />
            <Script
              async
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
              crossOrigin="anonymous"
              strategy="afterInteractive"
            />
          </>
        ) : null}

        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6">
          <header className="mb-8">
            <div className="flex items-center justify-between gap-4">
              <Link
                href="/"
                aria-label={locale === "ko" ? "홈으로 이동" : "Go to home"}
                className="inline-flex h-9 items-center gap-2 sm:h-10"
              >

                <Image
                  src="/logo.png"
                  alt="Duelboard logo"
                  width={148}
                  height={50}
                  priority
                  className="h-6 w-auto origin-left translate-y-[5px] scale-[4.4] [image-rendering:pixelated] sm:h-9 sm:translate-y-[5px] sm:scale-[5]"
                />
              </Link>

              <div className="hidden items-center gap-2 sm:gap-6 md:flex">
                <HeaderNav labels={t.nav} locale={locale} />
                <LanguageSwitcher locale={locale} />
              </div>

              <div className="flex items-center gap-2 md:hidden">
                <LanguageSwitcher locale={locale} />
                <MobileMenu labels={t.nav} />
              </div>
            </div>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="mt-14 pb-3">
            <div className="mb-6 h-px w-full bg-[#f5f5f5]" />
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm uppercase tracking-[0.08em]">
              <span className="text-[#f5f5f5]">&copy; duelboard 2026</span>
              <nav aria-label={locale === "ko" ? "푸터" : "Footer"}>
                <ul className="flex items-center gap-4">
                  <li>
                    <Link
                      href="/privacy"
                      className="text-[#f5f5f5] hover:text-[#f6d32d]"
                      aria-label={t.footer.privacy}
                    >
                      {t.footer.privacy}
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="text-[#f5f5f5] hover:text-[#f6d32d]" aria-label={t.footer.terms}>
                      {t.footer.terms}
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-[#f5f5f5] hover:text-[#f6d32d]" aria-label={t.footer.contact}>
                      {t.footer.contact}
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
