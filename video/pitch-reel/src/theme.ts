import type React from "react";
import { loadFont } from "@remotion/fonts";
import { Easing, interpolate, staticFile } from "remotion";

// Brand tokens, same values as the website (portfolio.html :root).
export const C = {
  bg: "#0D0A14",
  surface: "#17121F",
  raised: "#211A2C",
  ink: "#FFF7F0",
  ink2: "#CBC1D8",
  ink3: "#8F85A2",
  coral: "#FF4D2E",
  yellow: "#FFD60A",
  pink: "#D63BC6",
  violet: "#8B5CF6",
  aqua: "#22E3C0",
  magenta: "linear-gradient(135deg, #F03FA8, #A03DE6)",
};

export const HEAD = "Bricolage Grotesque";
export const BODY = "Instrument Sans";
export const MONO = "IBM Plex Mono";

loadFont({
  family: HEAD,
  url: staticFile("fonts/Bricolage-Grotesque-var.woff2"),
  weight: "200 800",
});
loadFont({
  family: BODY,
  url: staticFile("fonts/Instrument-Sans-var.woff2"),
  weight: "400 700",
});
loadFont({ family: MONO, url: staticFile("fonts/IBM-Plex-Mono-500.woff2"), weight: "500" });
loadFont({ family: MONO, url: staticFile("fonts/IBM-Plex-Mono-600.woff2"), weight: "600" });

// One beat of the music bed (120 BPM at 30 fps).
export const BEAT = 15;

export const EXPO = Easing.bezier(0.16, 1, 0.3, 1);
export const IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const IN = Easing.bezier(0.7, 0, 0.84, 0);
export const BACK = Easing.bezier(0.34, 1.56, 0.64, 1);

/** 0 → 1 between `start` and `start + dur`, clamped. */
export const p = (frame: number, start: number, dur: number, easing = EXPO) =>
  interpolate(frame, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const headline: React.CSSProperties = {
  fontFamily: HEAD,
  fontWeight: 800,
  letterSpacing: "-0.035em",
  lineHeight: 0.92,
  color: C.ink,
};

export const mono: React.CSSProperties = {
  fontFamily: MONO,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.2em",
  color: C.ink2,
};
