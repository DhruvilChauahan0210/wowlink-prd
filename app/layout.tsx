import type { Metadata } from "next";
import "./globals.css";
import "./cinematic.css";
import "./studio.css";

export const metadata: Metadata = {
  title: "WowLink — Make it a moment",
  description: "Create a beautiful, interactive invitation for the moments that matter.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
