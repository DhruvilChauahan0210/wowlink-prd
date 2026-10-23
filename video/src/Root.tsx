import { Composition } from "remotion";
import { FPS, Launch, TOTAL } from "./Launch";

/** Two shapes from one timeline: the vertical Reel (Instagram, YouTube Shorts, WhatsApp status) and a wide 16:9 cut. */
export function Root() {
  return <>
    <Composition id="LaunchVertical" component={Launch} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920}/>
    <Composition id="LaunchWide" component={Launch} durationInFrames={TOTAL} fps={FPS} width={1920} height={1080}/>
  </>;
}
