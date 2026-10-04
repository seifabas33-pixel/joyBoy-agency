import { AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { BgClip, Card, Clip, Line } from "../components";
import { C, EXPO, HEAD, headline, IN_OUT, mono, p } from "../theme";

// Part A (0-165): three night shows side by side, full height.
// Part B (165-300): the after-show crowd: "No studio. No extras."
const COLS = [
  { clip: "reel-egypt.mp4", at: 14.6, rate: 1, name: "Echo of Egypt Night", sub: "lanterns · lasers · the golden stage", pos: "50% 50%" },
  { clip: "reel-fire.mp4", at: 7.8, rate: 0.75, name: "Fire Show", sub: "on the amphitheatre stage", pos: "50% 50%" },
  { clip: "reel-light.mp4", at: 6.3, rate: 0.75, name: "Light Show", sub: "LED suits · glowing fans", pos: "50% 40%" },
];
const W = (1920 - 2 * 14) / 3;
const SPLIT = 165;

export const Shows: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Sequence durationInFrames={SPLIT + 10} premountFor={fps} name="Triptych">
        <Triptych />
      </Sequence>
      <Sequence from={SPLIT} premountFor={fps} name="No studio">
        <NoStudio />
      </Sequence>
      {/* hard wipe between the parts */}
      <AbsoluteFill
        style={{
          background: C.yellow,
          clipPath: `inset(0 ${100 - 100 * p(f, SPLIT - 8, 8, IN_OUT)}% 0 ${100 * p(f, SPLIT, 9, IN_OUT)}%)`,
        }}
      />
    </AbsoluteFill>
  );
};

const Triptych: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      {COLS.map((c, i) => {
        const t = p(f, i * 6, 22);
        return (
          <div
            key={c.name}
            style={{
              position: "absolute",
              left: i * (W + 14),
              top: 0,
              width: W,
              height: 1080,
              overflow: "hidden",
              clipPath: i % 2 ? `inset(0 0 ${(1 - t) * 100}% 0)` : `inset(${(1 - t) * 100}% 0 0 0)`,
            }}
          >
            <div style={{ position: "absolute", inset: 0, scale: String(interpolate(f, [0, 180], [1.16, 1.04], { easing: EXPO })) }}>
              <Clip src={c.clip} at={c.at} rate={c.rate} style={{ objectPosition: c.pos, filter: "contrast(1.06) saturate(1.12)" }} />
            </div>
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(0deg, rgba(13,10,20,0.92) 0%, rgba(13,10,20,0.35) 30%, rgba(13,10,20,0) 55%)",
              }}
            />
            <div style={{ position: "absolute", left: 48, right: 40, bottom: 70 }}>
              <div style={{ ...mono, fontSize: 24, color: C.yellow, marginBottom: 16 }}>
                <Line start={20 + i * 6}>{`0${i + 1}`}</Line>
              </div>
              <div style={{ ...headline, fontSize: 76 }}>
                <Line start={24 + i * 6}>{c.name}</Line>
              </div>
              <div style={{ ...mono, fontSize: 24, marginTop: 18, letterSpacing: "0.12em" }}>
                <Line start={30 + i * 6}>{c.sub}</Line>
              </div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const NoStudio: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <BgClip src="gallery-aftershow.mp4" at={0} dim={0.5} />
      <Card x={700} y={150} w={1100} h={622} rotate={-2} reveal={p(f, 4, 18)}>
        <Clip src="gallery-aftershow.mp4" at={0} style={{ filter: "contrast(1.05) saturate(1.1)" }} />
      </Card>
      <AbsoluteFill
        style={{ background: "linear-gradient(90deg, rgba(13,10,20,0.88) 0%, rgba(13,10,20,0.55) 40%, rgba(13,10,20,0) 70%)" }}
      />
      <div style={{ position: "absolute", left: 140, top: 560 }}>
        <div style={{ ...headline, fontSize: 168, textShadow: "0 12px 50px rgba(0,0,0,0.55)" }}>
          <Line start={10}>No studio.</Line>
          <Line start={16} style={{ color: C.yellow }}>No extras.</Line>
        </div>
        <div style={{ fontFamily: HEAD, fontWeight: 500, fontSize: 46, color: C.ink, marginTop: 36, lineHeight: 1.2 }}>
          <Line start={34}>Real guests, ordinary programme nights,</Line>
          <Line start={38}>filmed on the floor at resorts we run.</Line>
        </div>
      </div>
    </AbsoluteFill>
  );
};
