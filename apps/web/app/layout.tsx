import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";

const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  weight: "400",
  subsets: ["latin"],
});

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

const navItems = [
  { href: "/", label: "Home" },
  { href: "/games", label: "Games" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy-policy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${pressStart.variable} min-h-screen bg-slate-950 text-slate-100 antialiased`}>
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
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6">
          <header className="mb-8 rounded-lg border border-cyan-300/40 bg-slate-900/85 p-4 shadow-[0_0_24px_rgba(34,211,238,0.15)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <Link href="/" className="text-sm uppercase tracking-[0.2em] text-cyan-300">
                Duelboard
              </Link>
              <span className="rounded border border-emerald-300/50 px-2 py-1 text-[10px] uppercase text-emerald-300">
                Alpha Lobby
              </span>
            </div>
            <nav aria-label="Primary">
              <ul className="flex flex-wrap gap-3 text-[10px] uppercase tracking-[0.16em] text-slate-300">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link className="transition hover:text-cyan-200" href={item.href}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="mt-10 border-t border-slate-700/60 pt-4 text-[10px] uppercase tracking-[0.16em] text-slate-400">
            Duelboard skeleton build.
          </footer>
        </div>
      </body>
    </html>
  );
}
