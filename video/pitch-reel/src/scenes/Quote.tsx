import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Line } from "../components";
import { C, HEAD, mono, p } from "../theme";

// Verbatim, dated, attributed — exactly as on the website (portfolio.html, section 04).
const QUOTE =
  "The animation team — above all Gaia and Romana, together with DJ Junior — made the afternoons by the pool and the evenings in the theater, on the beach, and in the various piano bars lively and never boring, always with friendliness and without ever being intrusive.";
const NAMES = new Set(["Gaia", "Romana,", "DJ", "Junior"]);
const WORDS = QUOTE.split(" ");
const READ_FROM = 18;
const READ_TO = 225;

export const Quote: React.FC = () => {
  const f = useCurrentFrame();
  const per = (READ_TO - READ_FROM) / WORDS.length;
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Img
        src={staticFile("img/gallery-curtain-call.jpg")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "blur(18px) brightness(0.3) saturate(1.3)",
          scale: String(interpolate(f, [0, 300], [1.15, 1.28])),
        }}
      />
      <AbsoluteFill
        style={{ background: "radial-gradient(circle 1000px at 20% 15%, rgba(214,59,198,0.22), transparent 70%)" }}
      />

      <div
        style={{
          position: "absolute",
          left: 150,
          top: 96,
          fontFamily: HEAD,
          fontWeight: 800,
          fontSize: 420,
          lineHeight: 1,
          background: C.magenta,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          opacity: p(f, 0, 20),
          translate: `0 ${(1 - p(f, 0, 30)) * 60}px`,
        }}
      >
        “
      </div>

      <div
        style={{
          position: "absolute",
          left: 200,
          top: 330,
          width: 1540,
          fontFamily: HEAD,
          fontWeight: 600,
          fontSize: 64,
          lineHeight: 1.2,
          letterSpacing: "-0.012em",
          color: C.ink,
        }}
      >
        {WORDS.map((w, i) => {
          const t = p(f, READ_FROM + i * per, 10);
          return (
            <span
              key={i}
              style={{
                opacity: 0.16 + 0.84 * t,
                color: NAMES.has(w) ? C.yellow : undefined,
              }}
            >
              {w}{" "}
            </span>
          );
        })}
      </div>

      <div style={{ position: "absolute", left: 200, top: 862, display: "flex", alignItems: "center", gap: 28 }}>
        <Line start={30}>
          <span style={{ color: C.yellow, fontSize: 40, letterSpacing: "0.12em" }}>★★★★★</span>
        </Line>
        <Line start={36}>
          <span style={{ ...mono, fontSize: 26, color: C.ink }}>
            mdovetto · TripAdvisor · True Beach Resort · 30 Aug 2026
          </span>
        </Line>
      </div>
    </AbsoluteFill>
  );
};
