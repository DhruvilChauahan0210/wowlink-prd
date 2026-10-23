import CinematicHome from "./cinematic-home";

export const metadata = {
  title: "WowLink — Hand-drawn invitations, shared with one link",
  description: "Hand-drawn, interactive invitations for weddings, engagements, birthdays, Garba, seemant, housewarmings, anniversaries and grand openings, in Gujarati or English. Pick a drawing, add your story, and share it with one link.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return <CinematicHome />;
}
