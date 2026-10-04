/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);

// Claude cloud sessions ship Playwright's headless shell; use it instead of
// downloading Chrome Headless Shell (no direct internet from the renderer).
const pw = "/opt/pw-browsers";
if (existsSync(pw)) {
  const dir = readdirSync(pw).find((d) => d.startsWith("chromium_headless_shell"));
  if (dir) Config.setBrowserExecutable(path.join(pw, dir, "chrome-linux", "headless_shell"));
}
