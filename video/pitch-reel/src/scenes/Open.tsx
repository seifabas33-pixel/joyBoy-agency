import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Line, Ticket } from "../components";
import { BACK, C, EXPO, headline, IN, mono, p } from "../theme";

// The website's hero, in motion: a tilted wall of programme photos in the dark,
// lit by one roaming spotlight. Ends by blowing the light open onto the drop.
const WALL = [
  "poster-reel-egypt.jpg",
  "gallery-white-sensation.jpg",
  "poster-reel-light.jpg",
  "gallery-curtain-call.jpg",
  "poster-reel-theme.jpg",
  "poster-hero.jpg",
  "gallery-daytime-line.jpg",
  "poster-reel-kids.jpg",
  "gallery-theme-night-sendoff.jpg",
  "poster-gallery-aftershow.jpg",
];
const COLS = 6;
const ROWS = 4;
const CW = 380;
const CH = 560;
const GAP = 34;

const ease = (f: number, input: number[], output: number[]) =>
  interpolate(f, input, output, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EXPO,
  });

export const Open: React.FC = () => {
  const f = useCurrentFrame();

  const sx = interpolate(f, [0, 45, 90, 112], [1420, 1180, 1330, 980], {
    extrapolateRight: "clamp",
    easing: EXPO,
  });
  const sy = interpolate(f, [0, 45, 90, 112], [760, 520, 470, 540], {
    extrapolateRight: "clamp",
    easing: EXPO,
  });
  const r =
    ease(f, [0, 28], [0, 400]) + interpolate(f, [100, 120], [0, 1900], { extrapolateLeft: "clamp", easing: IN });
  const textOut = p(f, 98, 16, IN);

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      {/* the wall */}
      <div
        style={{
          position: "absolute",
          left: 960 - (COLS * (CW + GAP)) / 2,
          top: 540 - (ROWS * (CH + GAP)) / 2,
          width: COLS * (CW + GAP),
          height: ROWS * (CH + GAP),
          rotate: "-9deg",
          scale: String(interpolate(f, [0, 120], [1.02, 1.14])),
        }}
      >
        {Array.from({ length: COLS }).map((_, c) => (
          <div
            key={c}
            style={{
              position: "absolute",
              left: c * (CW + GAP),
              top: 0,
              translate: `0 ${(c % 2 ? -1 : 1) * (60 - f * 0.9) - (c % 2) * 180}px`,
            }}
          >
            {Array.from({ length: ROWS + 1 }).map((__, row) => (
              <div
                key={row}
                style={{
                  position: "absolute",
                  top: row * (CH + GAP),
                  width: CW,
                  height: CH,
                  borderRadius: 26,
                  overflow: "hidden",
                  background: C.raised,
                }}
              >
                <Img
                  src={staticFile(`img/${WALL[(c * 3 + row * 7) % WALL.length]}`)}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* the dark stage with one hole of light */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle ${Math.max(r, 1)}px at ${sx}px ${sy}px, rgba(13,10,20,0) 0%, rgba(13,10,20,0.12) 45%, rgba(13,10,20,0.95) 100%)`,
        }}
      />
      {/* the beam */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, mixBlendMode: "screen" }}>
        <defs>
          <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFF3D6" stopOpacity={0.0} />
            <stop offset="0.35" stopColor="#FFF3D6" stopOpacity={0.10} />
            <stop offset="1" stopColor="#FFF3D6" stopOpacity={0.02} />
          </linearGradient>
          <filter id="soft">
            <feGaussianBlur stdDeviation="22" />
          </filter>
        </defs>
        <polygon
          points={`1560,-40 1640,-40 ${sx + r * 0.75},${sy} ${sx - r * 0.75},${sy}`}
          fill="url(#beam)"
          filter="url(#soft)"
          opacity={ease(f, [6, 30], [0, 1]) * (1 - p(f, 104, 12))}
        />
      </svg>

      {/* type */}
      <AbsoluteFill style={{ padding: "0 140px", justifyContent: "center", opacity: 1 - textOut }}>
        <div
          style={{
            alignSelf: "flex-start",
            scale: String(interpolate(p(f, 22, 16, BACK), [0, 1], [1.6, 1])),
            rotate: `${interpolate(p(f, 22, 16, BACK), [0, 1], [-12, -4])}deg`,
            opacity: p(f, 22, 6),
            transformOrigin: "20% 50%",
            marginBottom: 56,
          }}
        >
          <Ticket parts={["Admit all", "7 nights a week", "One resident team"]} />
        </div>
        <div style={{ ...headline, fontSize: 200, translate: `0 ${-textOut * 40}px` }}>
          <Line start={44}>Joy Boy</Line>
          <Line start={50}>Agency.</Line>
        </div>
        <div style={{ marginTop: 44 }}>
          <Line start={66}>
            <span style={{ ...mono, fontSize: 34, color: C.ink }}>
              Entertainment &amp; animation · Red Sea resorts
            </span>
          </Line>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
