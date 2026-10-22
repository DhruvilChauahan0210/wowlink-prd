import type { Metadata } from "next";
import localFont from "next/font/local";
import { ArtFilters } from "./ui/art";
import "./globals.css";
import "./cinematic.css";
import "./studio.css";

// Absolute URLs for share previews (og:image and friends). Set NEXT_PUBLIC_SITE_URL to the public domain when deploying.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "WowLink — Make it a moment",
  description: "Create a beautiful, interactive invitation for the moments that matter.",
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${hand.variable} ${gujarati.variable}`}>
      <body>
        <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
          <ArtFilters boil/>
        </svg>
        {children}
      </body>
    </html>
  );
}
