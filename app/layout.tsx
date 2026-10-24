import type { Metadata } from "next";
import localFont from "next/font/local";
import { siteUrl } from "./lib/site";
import { ArtFilters } from "./ui/art";
import { FeedbackButton } from "./ui/feedback";
import { SiteVisit } from "./ui/site-visit";
import "./globals.css";
import "./cinematic.css";
import "./studio.css";


export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "WowLink — Make it a moment",
  description: "Create a beautiful, interactive invitation for the moments that matter.",
  // Google Search Console's check that the site is ours: the code from "HTML tag" verification.
  ...(process.env.GOOGLE_SITE_VERIFICATION && { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }),
};

// Self-hosted (OFL-licensed, see app/fonts) so builds and visitors never depend on reaching Google Fonts.
const serif = localFont({
  src: [
    { path: "./fonts/fraunces.woff2", style: "normal", weight: "300 600" },
    { path: "./fonts/fraunces-italic.woff2", style: "italic", weight: "300 600" },
  ],
  variable: "--font-serif",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
  adjustFontFallback: "Times New Roman",
});
const sans = localFont({ src: "./fonts/figtree.woff2", weight: "400 700", variable: "--font-sans", display: "swap", fallback: ["system-ui", "sans-serif"] });
const hand = localFont({ src: "./fonts/caveat.woff2", weight: "500 700", variable: "--font-hand", display: "swap", fallback: ["Segoe Script", "cursive"] });
const gujarati = localFont({ src: "./fonts/noto-serif-gujarati.woff2", weight: "500", variable: "--font-gujarati", display: "swap", fallback: ["serif"] });
// Gujarati with a handwritten feel, for the places Caveat is used (it has no Gujarati). Gujarati letters only.
const handGujarati = localFont({ src: "./fonts/farsan-gujarati.woff2", weight: "400", variable: "--font-hand-gujarati", display: "swap", fallback: ["cursive"] });
// Hindi: a serif for headings and the hand for notes, Devanagari letters only (so Latin keeps Fraunces and Caveat).
const devanagari = localFont({ src: "./fonts/noto-serif-devanagari.woff2", weight: "500", variable: "--font-devanagari", display: "swap", fallback: ["serif"] });
const handDevanagari = localFont({ src: "./fonts/kalam-devanagari.woff2", weight: "700", variable: "--font-hand-devanagari", display: "swap", fallback: ["cursive"] });

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${hand.variable} ${gujarati.variable} ${handGujarati.variable} ${devanagari.variable} ${handDevanagari.variable}`}>
      <body>
        <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
          <ArtFilters boil/>
        </svg>
        {children}
        <SiteVisit/>
        <FeedbackButton/>
      </body>
    </html>
  );
}
