import { Video } from "@remotion/media";
import type React from "react";
import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Img,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { C, EXPO, IN_OUT, MONO, mono, p } from "./theme";

const GRAIN = Array.from({ length: 8 }, (_, i) => staticFile(`grain/g${i}.png`));

/** Moving film grain over the whole frame. */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.32 }) => {
  const frame = useCurrentFrame();
  // The tiles are repeated with background-image, which Remotion does not wait
  // for; hold the render until all eight are in the browser cache instead.
  const [handle] = useState(() => delayRender("Loading grain tiles"));
  useEffect(() => {
    Promise.all(
      GRAIN.map(
        (src) =>
          new Promise((resolve) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = resolve;
            img.src = src;
          }),
      ),
    ).then(() => continueRender(handle));
  }, [handle]);
  const tile = Math.floor(frame / 2) % 8;
  const x = Math.floor(random(`gx${frame >> 1}`) * 320);
  const y = Math.floor(random(`gy${frame >> 1}`) * 320);
  return (
    <AbsoluteFill
      style={{
        // eslint-disable-next-line @remotion/no-background-image -- preloaded above
        backgroundImage: `url(${GRAIN[tile]})`,
        backgroundSize: "320px 320px",
        backgroundPosition: `${x}px ${y}px`,
        mixBlendMode: "overlay",
        opacity,
        pointerEvents: "none",
      }}
    />
  );
};

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.6 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 75% 70% at 50% 50%, transparent 55%, rgba(5,3,9,${strength}) 100%)`,
      pointerEvents: "none",
    }}
  />
);

/**
 * A line of text that slides up out of a mask.
 * `start` = first frame of the entrance, `out` = first frame of the exit.
 */
export const Line: React.FC<{
  start: number;
  dur?: number;
  out?: number;
  outDur?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ start, dur = 20, out, outDur = 12, style, children }) => {
  const frame = useCurrentFrame();
  const t = p(frame, start, dur);
  const o = out === undefined ? 0 : p(frame, out, outDur, IN_OUT);
  const hidden = t <= 0 || o >= 1;
  return (
    <div style={{ overflow: "hidden", padding: "0.12em 0.1em", margin: "-0.12em -0.1em" }}>
      <div
        style={{
          visibility: hidden ? "hidden" : "visible",
          translate: `0 ${(1 - t) * 140 - o * 140}%`,
          rotate: `${(1 - t) * 4}deg`,
          transformOrigin: "0 100%",
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  );
};

/** Small uppercase label in the mono face. */
export const Label: React.FC<{
  start: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ start, style, children }) => {
  const frame = useCurrentFrame();
  const t = p(frame, start, 18);
  return (
    <div
      style={{
        ...mono,
        fontSize: 30,
        opacity: t,
        translate: `${(1 - t) * -24}px 0`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** A clip that fills its parent. */
export const Clip: React.FC<{
  src: string;
  at: number; // seconds into the source
  from?: number;
  rate?: number;
  style?: React.CSSProperties;
}> = ({ src, at, from = 0, rate = 1, style }) => {
  const { fps } = useVideoConfig();
  return (
    <Video
      src={staticFile(src)}
      trimBefore={Math.round(at * fps)}
      from={from}
      premountFor={fps}
      playbackRate={rate}
      muted
      objectFit="cover"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", ...style }}
    />
  );
};

export const Photo: React.FC<{
  src: string;
  position?: string;
  zoom?: [number, number];
  dur?: number;
  style?: React.CSSProperties;
}> = ({ src, position = "50% 50%", zoom = [1.04, 1.14], dur = 240, style }) => {
  const frame = useCurrentFrame();
  return (
    <Img
      src={staticFile(src)}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: position,
        scale: String(interpolate(frame, [0, dur], zoom, { extrapolateRight: "clamp" })),
        ...style,
      }}
    />
  );
};

/** Full-frame soft background made from the pre-blurred copy of a clip. */
export const BgClip: React.FC<{ src: string; at: number; dim?: number; from?: number }> = ({
  src,
  at,
  dim = 0.42,
  from = 0,
}) => (
  <Clip
    src={`bg/${src}`}
    at={at}
    from={from}
    style={{ filter: `brightness(${dim}) saturate(1.35)`, scale: "1.12" }}
  />
);

/** Rounded media card with a deep shadow; `reveal` 0..1 wipes it in from below. */
export const Card: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  reveal?: number;
  rotate?: number;
  radius?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ x, y, w, h, reveal = 1, rotate = 0, radius = 30, style, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      rotate: `${rotate}deg`,
      filter: `drop-shadow(0 40px 60px rgba(0,0,0,${0.55 * reveal}))`,
      ...style,
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: radius,
        overflow: "hidden",
        background: C.raised,
        clipPath: `inset(${(1 - reveal) * 100}% 0 0 0 round ${radius}px)`,
        boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.10)",
      }}
    >
      <div style={{ position: "absolute", inset: 0, scale: String(1 + (1 - reveal) * 0.25) }}>
        {children}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: radius,
          boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.12)",
        }}
      />
    </div>
  </div>
);

/** The website's yellow ticket badge. */
export const Ticket: React.FC<{ parts: string[]; style?: React.CSSProperties }> = ({
  parts,
  style,
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 22,
      padding: "18px 40px",
      background: C.yellow,
      color: C.bg,
      fontFamily: MONO,
      fontWeight: 600,
      fontSize: 30,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      WebkitMaskImage:
        "radial-gradient(circle at 0 50%, transparent 16px, #000 17px), radial-gradient(circle at 100% 50%, transparent 16px, #000 17px)",
      WebkitMaskComposite: "source-in",
      maskComposite: "intersect",
      boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
      ...style,
    }}
  >
    <span>{parts[0]}</span>
    <span
      style={{ alignSelf: "stretch", margin: "-8px 0", borderLeft: "3px dashed rgba(13,10,20,0.5)" }}
    />
    <span style={{ whiteSpace: "pre" }}>{parts.slice(1).join("  ·  ")}</span>
  </div>
);

/** A warm streak of light that sweeps across the frame, centred on `at`. */
export const Leak: React.FC<{ at: number; dur?: number; hue?: "warm" | "pink" }> = ({
  at,
  dur = 22,
  hue = "warm",
}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [at - dur / 2, at + dur / 2], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (t <= 0 || t >= 1) return null;
  const a = Math.sin(t * Math.PI);
  const x = -25 + t * 150;
  const c1 = hue === "warm" ? "255,150,40" : "240,63,168";
  const c2 = hue === "warm" ? "255,77,46" : "160,61,230";
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", opacity: a * 0.8, pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          background: `linear-gradient(105deg, transparent ${x - 34}%, rgba(${c2},0.35) ${x - 18}%, rgba(${c1},0.8) ${x - 5}%, rgba(255,240,205,0.95) ${x}%, rgba(${c1},0.7) ${x + 6}%, rgba(${c2},0.3) ${x + 18}%, transparent ${x + 32}%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 14% 70% at ${x + 3}% 40%, rgba(255,246,220,0.55), transparent 70%)`,
        }}
      />
    </AbsoluteFill>
  );
};

/** A short white flash on a hard cut. */
export const Flash: React.FC<{ at: number; dur?: number; color?: string }> = ({
  at,
  dur = 9,
  color = "#FFF7F0",
}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at - 1, at, at + dur], [0, 0.85, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EXPO,
  });
  if (o <= 0.001) return null;
  return <AbsoluteFill style={{ background: color, opacity: o, mixBlendMode: "screen" }} />;
};

/** Dark gradient for type sitting on footage. */
export const Shade: React.FC<{ side?: "left" | "bottom" | "right"; strength?: number }> = ({
  side = "left",
  strength = 0.92,
}) => {
  const dir = side === "left" ? "90deg" : side === "right" ? "270deg" : "0deg";
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${dir}, rgba(13,10,20,${strength}) 0%, rgba(13,10,20,${strength * 0.75}) 38%, rgba(13,10,20,0) 75%)`,
      }}
    />
  );
};
