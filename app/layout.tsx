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
      <body>
        <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
          {/* a steady hand-drawn wobble for ink */}
          <filter id="wobble" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".022" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="4"/></filter>
          {/* the same wobble, redrawn a few times a second, like hand-drawn animation */}
          <filter id="boil" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".03" numOctaves="2" seed="1" result="n"><animate attributeName="seed" values="1;4;7" dur="0.42s" calcMode="discrete" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" in2="n" scale="3"/></filter>
          {/* loose, mottled colour that bleeds past the lines */}
          <filter id="wash" x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="3" result="warp"/><feDisplacementMap in="SourceGraphic" in2="warp" scale="8" xChannelSelector="R" yChannelSelector="G" result="shape"/><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="1" seed="8" result="grain"/><feColorMatrix in="grain" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -.9 1.15" result="mottle"/><feComposite in="shape" in2="mottle" operator="in" result="tex"/><feOffset in="tex" dx="2.5" dy="2"/></filter>
        </svg>
        {children}
      </body>
    </html>
  );
}
