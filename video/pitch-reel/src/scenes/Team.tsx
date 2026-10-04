import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Line } from "../components";
import { BACK, BEAT, C, HEAD, headline, mono, p } from "../theme";

// 7/7: the programme every night, the four lines a resident team covers.
const LINES = [
  { color: C.coral, title: "Evening shows", sub: "dance · fire · singers · theme nights" },
  { color: C.yellow, title: "The daytime line", sub: "aqua gym · sports · pool & beach parties" },
  { color: C.aqua, title: "Kids club", sub: "daily sessions · nightly mini disco" },
  { color: C.violet, title: "Live music", sub: "instrumentalists & singers on rotation" },
];

export const Team: React.FC = () => {
  const f = useCurrentFrame();
  // 1/7 … 7/7, one step per eighth note
  const n = Math.min(7, 1 + Math.floor(Math.max(0, f - 2) / (BEAT / 2)));
  const pop = interpolate((f - 2) % (BEAT / 2), [0, 5], [1.06, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* slow glows so the type slide still breathes */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle 700px at ${interpolate(f, [0, 180], [20, 32])}% 60%, rgba(160,61,230,0.30), transparent 70%), radial-gradient(circle 600px at ${interpolate(f, [0, 180], [92, 80])}% 20%, rgba(240,63,168,0.18), transparent 70%)`,
        }}
      />

      <div style={{ position: "absolute", left: 140, top: 190 }}>
        <div style={{ ...mono, fontSize: 28, color: C.yellow }}>
          <Line start={0}>Every night is programme night</Line>
        </div>
        <div
          style={{
            ...headline,
            fontSize: 400,
            color: C.yellow,
            marginTop: 20,
            fontVariantNumeric: "tabular-nums",
            scale: String(n < 7 ? pop : interpolate(p(f, 47, 10, BACK), [0, 1], [1.08, 1])),
            transformOrigin: "0 70%",
          }}
        >
          <Line start={0} dur={12}>{`${n}/7`}</Line>
        </div>
        <div style={{ ...headline, fontSize: 92, marginTop: 6 }}>
          <Line start={14}>nights a week.</Line>
        </div>
      </div>

      <div style={{ position: "absolute", left: 1000, top: 196, width: 800 }}>
        {LINES.map((l, i) => {
          const s = 28 + i * BEAT;
          const t = p(f, s, 18);
          return (
            <div
              key={l.title}
              style={{
                display: "flex",
                gap: 30,
                alignItems: "flex-start",
                padding: "22px 0",
                borderTop: `2px solid rgba(255,247,240,${0.14 * t})`,
                opacity: t,
                translate: `${(1 - t) * 60}px 0`,
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  marginTop: 20,
                  background: l.color,
                  scale: String(p(f, s + 2, 12, BACK)),
                  boxShadow: `0 0 30px ${l.color}`,
                }}
              />
              <div>
                <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 64, color: C.ink, letterSpacing: "-0.02em", lineHeight: 1 }}>
                  {l.title}
                </div>
                <div style={{ ...mono, fontSize: 24, marginTop: 14, letterSpacing: "0.1em", whiteSpace: "nowrap" }}>{l.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ position: "absolute", left: 140, top: 900, ...headline, fontSize: 64, fontWeight: 700, letterSpacing: "-0.02em" }}>
        <Line start={104}>
          One resident team. <span style={{ color: C.ink3 }}>Not visiting acts.</span>
        </Line>
      </div>
    </AbsoluteFill>
  );
};
