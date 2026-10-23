"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { WowLinkBrand } from "../ui/brand";
import { HostLangSwitch, useHostLang } from "../ui/host-lang";
import { SignIn } from "../ui/sign-in";
import { useAccount } from "../ui/account";

/** Signing in on its own page (from My invitations, or back from Google when it didn't work). */
export default function SignInPage() {
  const { lang, h, choose } = useHostLang();
  const account = useAccount();
  const [next, setNext] = useState("/mine");
  const [failed, setFailed] = useState(false);
  // Arrived from the email's link, in a new tab: the tab that asked for it carries on by itself.
  const [fromLink, setFromLink] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const wanted = params.get("next") ?? "";
    if (/^\/(?!\/)[^\\]*$/.test(wanted)) setNext(wanted);
    setFailed(params.has("failed"));
    setFromLink(params.has("signed"));
  }, []);
  // Already signed in: straight on (unless this tab came from the email's link).
  useEffect(() => {
    if (account.email && !fromLink && !new URLSearchParams(location.search).has("signed")) location.replace(next);
  }, [account.email, next, fromLink]);

  return <div className="cinema manage-page mine-page" lang={lang}>
    <header className="studio-header theme-paper">
      <WowLinkBrand/>
      <span className="studio-header-label">{h.signInTitle}</span>
      <div className="studio-header-actions"><HostLangSwitch h={h} choose={choose}/><Link className="studio-fullscreen" href="/mine">{h.myInvitations}</Link></div>
    </header>
    <main className="manage theme-paper">
      <section className="sketch-card manage-card sign-in-card" aria-labelledby="sign-in-heading">
        {fromLink && account.email ? <>
          <h1 id="sign-in-heading">{h.signedInTitle}</h1>
          <p className="manage-muted">{h.signedInBody}</p>
          <div className="manage-actions"><Link className="cin-cta cin-cta-light" href={next}>{h.continueHere}</Link></div>
        </> : <>
          <h1 id="sign-in-heading">{h.signInTitle}</h1>
          <p className="manage-muted">{h.signInBody}</p>
          {failed && <p className="studio-error" role="alert">{h.signInFailed}</p>}
          {account.ready && !account.accounts ? <p className="manage-muted">{h.accountsOff}</p> : <SignIn h={h} next={next} onSignedIn={() => location.replace(next)}/>}
        </>}
      </section>
    </main>
  </div>;
}
