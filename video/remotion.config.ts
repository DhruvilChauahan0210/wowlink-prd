import { Config } from "@remotion/cli/config";

// Sharp frames for the screenshots, and a high-quality H.264 that Instagram and YouTube take as is.
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setCodec("h264");
Config.setCrf(16);
Config.setEntryPoint("src/index.ts");
// Port 3000 is the WowLink dev server: Remotion uses its own.
Config.setStudioPort(3210);
Config.setRendererPort(3211);
