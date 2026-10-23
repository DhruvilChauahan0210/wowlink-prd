"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { countSiteVisit } from "./counting";

/** Counts visits to WowLink (countSiteVisit) as pages change. In the root layout, so every page has it. */
export function SiteVisit() {
  const path = usePathname();
  useEffect(() => { if (path) countSiteVisit(path); }, [path]);
  return null;
}
