import type { MetadataRoute } from "next";

/* The web app manifest: the name and icons a browser shows when WowLink is added to a home screen, and that search engines read about the site. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WowLink",
    short_name: "WowLink",
    description: "Hand-drawn online invitations for weddings, Garba, birthdays and pujas, in Gujarati, Hindi or English, shared as one link on WhatsApp.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3ebdc",
    theme_color: "#f3ebdc",
    lang: "en",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
