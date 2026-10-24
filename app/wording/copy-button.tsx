"use client";

import { useEffect, useState } from "react";

type State = "idle" | "copied" | "selected";

/**
 * Copies a wording as it's written, line breaks and all, and says so (to screen readers too, from a status line beside
 * the button rather than inside it). Where the browser won't copy, it selects the words on the card instead, for the
 * phone's own Copy.
 */
export function CopyButton({ text, textId, what }: { text: string; textId: string; what: string }) {
  const [state, setState] = useState<State>("idle");
  useEffect(() => {
    if (state !== "copied") return;
    const timer = setTimeout(() => setState("idle"), 2200);
    return () => clearTimeout(timer);
  }, [state]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      return setState("copied");
    } catch { /* no clipboard access (an older or embedded browser): try a selection */ }
    const area = document.createElement("textarea");
    area.value = text;
    area.style.cssText = "position:fixed;top:0;opacity:0";
    document.body.append(area);
    area.select();
    area.setSelectionRange(0, text.length); // iOS selects nothing without this
    const copied = document.execCommand("copy");
    area.remove();
    if (copied) return setState("copied");
    const words = document.getElementById(textId);
    if (words) window.getSelection()?.selectAllChildren(words);
    setState("selected");
  }

  return <>
    <button type="button" className={`wording-copy${state === "copied" ? " is-copied" : ""}`} onClick={copy}>
      {state === "copied" ? "Copied" : "Copy"}<span className="studio-sr-only"> {what}</span>
    </button>
    <span className="studio-sr-only" role="status">{state === "copied" ? `Copied ${what}.` : state === "selected" ? `Couldn’t copy by itself: the words are selected, so copy them from the menu.` : ""}</span>
  </>;
}
