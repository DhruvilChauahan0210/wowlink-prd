"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { WowLinkBrand } from "../ui/brand";
import { HostLangSwitch, useHostLang } from "../ui/host-lang";
import { SignIn } from "../ui/sign-in";
import { useAccount } from "../ui/account";
import { SiteFooter } from "../ui/site-footer";

/** Signing in on its own page (from a manage page without its link, or back from Google when it didn't work). */
export default function SignInPage() {
  const { lang, h, choose } = useHostLang();
  const account = useAccount();
  const [next, setNext] = useState("/mine");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const wanted = params.get("next") ?? "";
    if (/^\/(?!\/)[^\\]*$/.test(wanted)) setNext(wanted);
    setFailed(params.has("failed"));
  }, []);
  // Already signed in: straight on (unless signing in just failed, which this page then says).
  useEffect(() => {
    if (account.email && !failed && !new URLSearchParams(location.search).has("failed")) location.replace(next);
  }, [account.email, next, failed]);

  return <div className="cinema manage-page mine-page" lang={lang}>
    <header className="studio-header theme-paper">
      <WowLinkBrand/>
      <span className="studio-header-label">{h.signInTitle}</span>
      <div className="studio-header-actions"><HostLangSwitch h={h} choose={choose}/><Link className="studio-fullscreen" href="/mine">{h.myInvitations}</Link></div>
    </header>
    <main className="manage theme-paper">
      <section className="sketch-card manage-card sign-in-card" aria-labelledby="sign-in-heading">
        <h1 id="sign-in-heading">{h.signInTitle}</h1>
        <p className="manage-muted">{h.signInBody}</p>
        {failed && <p className="studio-error" role="alert">{h.signInFailed}</p>}
        {account.ready && !account.accounts ? <p className="manage-muted">{h.accountsOff}</p> : <SignIn h={h} next={next}/>}
        {/* Back where they came from (the studio keeps the draft), without publishing on the way. */}
        {next !== "/mine" && <Link className="cin-text-link sign-in-back" href={next.replace(/[?&]publish=1/, "")}>{h.goBackSignedOut}</Link>}
      </section>
    </main>
    <SiteFooter lang={lang}/>
  </div>;
}
