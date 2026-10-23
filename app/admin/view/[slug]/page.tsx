"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getInvitationTemplate } from "../../../lib/invitations";
import type { PublicExperience } from "../../../lib/store";
import { GuestExperience } from "../../../ui/guest-experience";

/*
 * The admin's look at an invitation, as its guests see (or saw) it, whatever its state. Shown as a preview: nothing
 * here is counted as a visit, and the reply form doesn't send.
 */
export default function AdminView() {
  const { slug } = useParams<{ slug: string }>();
  const [view, setView] = useState<PublicExperience | null>(null);
  const [problem, setProblem] = useState("");

  useEffect(() => {
    let key = "";
    try { key = sessionStorage.getItem("wowlink:admin-key") ?? ""; } catch { /* no key */ }
    if (!key) return setProblem("Open the admin page first.");
    void fetch(`/api/admin/invitations/${slug}/view`, { headers: { authorization: `Bearer ${key}` }, cache: "no-store" })
      .then(async response => (response.ok ? setView(((await response.json()) as { view: PublicExperience }).view) : setProblem(response.status === 429 ? "Too many wrong tries. Try again in an hour." : "There’s no invitation at that link.")))
      .catch(() => setProblem("Couldn’t load it. Check your connection."));
  }, [slug]);

  if (!view) return <div className="cinema cin-catalog theme-paper"><main className="report"><h1>Admin view</h1><p className="report-which" role="status">{problem || "Loading…"}</p><Link className="cin-text-link" href="/admin">← Back to the admin</Link></main></div>;
  const { slug: _slug, templateId, wishes, ...draft } = view;
  return <>
    <p className="admin-view-banner" role="note">Admin view: how guests see it. Nothing here is counted or sent. <Link href="/admin">← Back to the admin</Link></p>
    <GuestExperience template={getInvitationTemplate(templateId)} draft={draft} mode="live" slug={slug} previewOnly wishes={wishes}/>
  </>;
}
