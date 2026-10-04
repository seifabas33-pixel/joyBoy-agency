import { Audio } from "@remotion/media";
import { AbsoluteFill, Img, interpolate, Sequence, Series, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Flash, Grain, Leak, Vignette } from "./components";
import { Cta } from "./scenes/Cta";
import { Hook } from "./scenes/Hook";
import { Method } from "./scenes/Method";
import { Open } from "./scenes/Open";
import { Proof } from "./scenes/Proof";
import { Quote } from "./scenes/Quote";
import { Shows } from "./scenes/Shows";
import { Team } from "./scenes/Team";
import { C, EXPO, mono, p } from "./theme";
import { VOICE_OVER } from "./voiceover";

// Under the voice the music's speech band (250 Hz-5 kHz stem) drops to 0.12,
// the rest (kick, bass, hats) only to 0.6: the voice stays ~12 dB clear where
// speech lives and the beat keeps its punch. Lines closer than a second share
// one dip, so the music does not pump between short phrases.
const RAMP = 8;
const DUCK_WINDOWS = VOICE_OVER.reduce<[number, number][]>((acc, l) => {
  const last = acc[acc.length - 1];
  const end = l.from + l.frames;
  if (last && l.from - last[1] < 30) last[1] = end;
  else acc.push([l.from, end]);
  return acc;
}, []);
const duck = (f: number, depth: number) =>
  DUCK_WINDOWS.reduce(
    (v, [a, b]) =>
      Math.min(
        v,
        interpolate(f, [a - RAMP, a, b, b + RAMP * 2], [1, depth, depth, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      ),
    1,
  );

// 62 s, 1920×1080, 30 fps. Every cut sits on the beat of public/music.wav
// (tools/music.py, 120 BPM = 15 frames a beat, 60 frames a bar).
//   Open 0 · Hook 120 · Shows 360 · Team 660 · Proof 840 · Quote 1140 · Method 1440 · CTA 1620 → 1860
export const PitchReel: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Series>
        <Series.Sequence name="Open" durationInFrames={120} premountFor={fps}>
          <Open />
        </Series.Sequence>
        <Series.Sequence name="Hook" durationInFrames={240} premountFor={fps}>
          <Hook />
        </Series.Sequence>
        <Series.Sequence name="Shows" durationInFrames={300} premountFor={fps}>
          <Shows />
        </Series.Sequence>
        <Series.Sequence name="Team" durationInFrames={180} premountFor={fps}>
          <Team />
        </Series.Sequence>
        <Series.Sequence name="Proof" durationInFrames={300} premountFor={fps}>
          <Proof />
        </Series.Sequence>
        <Series.Sequence name="Quote" durationInFrames={300} premountFor={fps}>
          <Quote />
        </Series.Sequence>
        <Series.Sequence name="Method" durationInFrames={180} premountFor={fps}>
          <Method />
        </Series.Sequence>
        <Series.Sequence name="CTA" durationInFrames={240} premountFor={fps}>
          <Cta />
        </Series.Sequence>
      </Series>

      <Sequence name="HUD" from={120} durationInFrames={1500} premountFor={fps}>
        <Hud />
      </Sequence>

      <Leak at={360} />
      <Leak at={840} />
      <Leak at={1140} hue="pink" dur={34} />
      <Flash at={120} />
      <Flash at={1440} />
      <Flash at={1620} />

      <Vignette />
      <Grain />
      <Audio src={staticFile("music-body.wav")} volume={(f) => duck(f, 0.6)} />
      <Audio src={staticFile("music-mid.wav")} volume={(f) => duck(f, 0.12)} />
      {VOICE_OVER.map((l) => (
        <Sequence key={l.id} name={`Voice: ${l.text}`} from={l.from} durationInFrames={l.frames + 4} premountFor={fps}>
          <Audio src={staticFile(`vo/${l.id}.wav`)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const CHAPTERS: [number, string][] = [
  [0, "The night"],
  [240, "The shows"],
  [540, "The team"],
  [720, "The results"],
  [1020, "The guests"],
  [1320, "The method"],
];

/** Brand mark top left, chapter top right. Frames are relative to the Hook. */
const Hud: React.FC = () => {
  const f = useCurrentFrame();
  const inT = p(f, 4, 20);
  const outT = p(f, 1480, 20);
  return (
    <AbsoluteFill style={{ opacity: inT * (1 - outT), pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 140, top: 56, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 22, overflow: "hidden", background: "#fff", boxShadow: "0 0 0 2px rgba(255,214,10,0.9)" }}>
          <Img src={staticFile("img/logo.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", scale: "1.08" }} />
        </div>
        <div style={{ ...mono, fontSize: 22, color: C.ink, textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}>Joy Boy Agency</div>
      </div>
      <div style={{ position: "absolute", right: 140, top: 66, height: 30, overflow: "hidden", width: 560 }}>
        {CHAPTERS.map(([at, name], i) => {
          const next = CHAPTERS[i + 1]?.[0] ?? 99999;
          const y = interpolate(f, [at, at + 12, next, next + 12], [100, 0, 0, -100], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: EXPO,
          });
          return (
            <div
              key={name}
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                translate: `0 ${y}%`,
                ...mono,
                fontSize: 22,
                color: C.ink,
                whiteSpace: "pre",
                textShadow: "0 2px 12px rgba(0,0,0,0.6)",
              }}
            >
              <span style={{ color: C.yellow }}>{`0${i + 1} / 06`}</span>
              {`   ${name}`}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
