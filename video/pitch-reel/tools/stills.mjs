// Renders a set of frames to out/stills/ with one bundle (for visual checks).
// Usage: node tools/stills.mjs [compositionId] frame frame ...
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const id = isNaN(Number(args[0])) ? args.shift() : "PitchReel";
const frames = args.map(Number);
const hsRoot = "/opt/pw-browsers";
const hsDir = readdirSync(hsRoot).find((d) => d.startsWith("chromium_headless_shell"));
const browserExecutable = hsDir ? path.join(hsRoot, hsDir, "chrome-linux", "headless_shell") : null;
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id, browserExecutable });
for (const frame of frames) {
  const output = `out/stills/${id}-${String(frame).padStart(4, "0")}.jpg`;
  await renderStill({ composition, serveUrl, output, frame, browserExecutable, imageFormat: "jpeg", jpegQuality: 85, overwrite: true });
  console.log(output, existsSync(output));
}
