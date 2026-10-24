import CinematicHome from "./cinematic-home";
import { organization, webApplication, website } from "./lib/structured-data";
import { JsonLd } from "./ui/json-ld";

export const metadata = {
  title: "Hand-drawn online invitations for WhatsApp — WowLink",
  description: "Make a hand-drawn invitation for a wedding, Garba, birthday or puja in Gujarati, Hindi or English. Share one link on WhatsApp; guests reply in a tap. Free.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return <>
    <JsonLd data={[organization(), website(), webApplication()]}/>
    <CinematicHome/>
  </>;
}
