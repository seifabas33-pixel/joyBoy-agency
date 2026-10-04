import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Line } from "../components";
import { BODY, C, HEAD, headline, mono, p } from "../theme";

// How we run it — the line from the website: "Nothing runs on hope."
const ITEMS = [
  { title: "Weekly action plan", sub: "Every event has a setup time, a soundcheck and a named owner." },
  { title: "Daily attendance register", sub: "Presence per person, every day, totalled monthly." },
  { title: "Published guest programme", sub: "On a board and by QR code." },
  { title: "Monthly report", sub: "Punctuality, sessions delivered, review mentions." },
];

export const Method: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <AbsoluteFill
        style={{ background: `radial-gradient(circle 900px at ${interpolate(f, [0, 180], [85, 70])}% 10%, rgba(255,77,46,0.16), transparent 70%)` }}
      />
      <div style={{ position: "absolute", left: 140, top: 160, ...headline, fontSize: 150 }}>
        <Line start={0} dur={16}>
          Nothing runs <span style={{ color: C.coral }}>on hope.</span>
        </Line>
      </div>
      {ITEMS.map((it, i) => {
        const s = 22 + i * 8;
        const t = p(f, s, 20);
        const col = i % 2;
        const row = Math.floor(i / 2);
        return (
          <div
            key={it.title}
            style={{
              position: "absolute",
              left: 140 + col * 840,
              top: 400 + row * 270,
              width: 800,
              height: 240,
              borderRadius: 28,
              background: C.surface,
              boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.08), 0 30px 60px rgba(0,0,0,0.35)",
              padding: "34px 40px",
              display: "flex",
              gap: 30,
              opacity: p(f, s, 8),
              translate: `0 ${(1 - t) * 90}px`,
            }}
          >
            <Check progress={p(f, s + 8, 14)} />
            <div>
              <div style={{ ...mono, fontSize: 22, color: C.coral }}>{`0${i + 1}`}</div>
              <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 54, color: C.ink, letterSpacing: "-0.02em", marginTop: 8 }}>
                {it.title}
              </div>
              <div style={{ fontFamily: BODY, fontWeight: 500, fontSize: 30, color: C.ink2, marginTop: 10, lineHeight: 1.3 }}>
                {it.sub}
              </div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Check: React.FC<{ progress: number }> = ({ progress }) => (
  <svg width={64} height={64} viewBox="0 0 64 64" style={{ flexShrink: 0, marginTop: 4 }}>
    <circle cx={32} cy={32} r={29} fill="none" stroke="rgba(255,247,240,0.16)" strokeWidth={3} />
    <circle
      cx={32}
      cy={32}
      r={29}
      fill={progress > 0.99 ? C.coral : "none"}
      stroke={C.coral}
      strokeWidth={3}
      strokeDasharray={182}
      strokeDashoffset={182 * (1 - progress)}
      transform="rotate(-90 32 32)"
    />
    <path
      d="M19 33 L28 42 L46 23"
      fill="none"
      stroke={progress > 0.99 ? C.bg : C.coral}
      strokeWidth={5}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={40}
      strokeDashoffset={40 * (1 - p(progress * 14, 6, 8))}
    />
  </svg>
);
