import { ImageResponse } from "next/og";
import { SEAL_CREAM, SEAL_EDGE, SEAL_RED, SEAL_W, SEAL_W_TRANSFORM } from "./ui/brand";
import { renderSvg } from "./lib/svg-string";

/* The icon a phone shows when WowLink is added to its home screen: the seal on WowLink's paper. */

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const seal = renderSvg(
  <svg xmlns="http://www.w3.org/2000/svg" width="132" height="132" viewBox="0 0 100 100">
    <path d={SEAL_EDGE} fill={SEAL_RED} />
    <circle cx="50" cy="50" r="31" fill="none" stroke={SEAL_CREAM} strokeOpacity=".4" strokeWidth="1.4" strokeDasharray="1.6 3.2" strokeLinecap="round" />
    <path d={SEAL_W} transform={SEAL_W_TRANSFORM} fill="none" stroke={SEAL_CREAM} strokeWidth="6.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>,
);

export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f3ebdc" }}>
      <img src={`data:image/svg+xml;base64,${Buffer.from(seal).toString("base64")}`} width={132} height={132} style={{ transform: "rotate(-6deg)" }} />
    </div>,
    size,
  );
}
