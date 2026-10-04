import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Line } from "../components";
import { BACK, C, EXPO, HEAD, headline, IN_OUT, mono, p } from "../theme";

// Call to action. The logo lock-up lands on the music's last hit (frame 120).
const LAND = 120;

export const Cta: React.FC = () => {
  const f = useCurrentFrame();
  const shrink = p(f, LAND - 26, 26, IN_OUT);
  const beamA = interpolate(f, [0, 30], [0, 1], { extrapolateRight: "clamp", easing: EXPO });

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      {/* stage light */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 900px 560px at 50% ${interpolate(f, [0, 240], [40, 46])}%, rgba(255,214,10,${0.16 * beamA}), rgba(240,63,168,${0.08 * beamA}) 45%, transparent 75%)`,
        }}
      />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, mixBlendMode: "screen", opacity: beamA * (1 - shrink * 0.5) }}>
        <defs>
          <linearGradient id="ctabeam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFF3D6" stopOpacity={0.16} />
            <stop offset="1" stopColor="#FFF3D6" stopOpacity={0} />
          </linearGradient>
          <filter id="ctasoft">
            <feGaussianBlur stdDeviation="26" />
          </filter>
        </defs>
        <polygon points="900,-60 1020,-60 1460,900 460,900" fill="url(#ctabeam)" filter="url(#ctasoft)" />
      </svg>

      {/* headline: big first, then it makes room for the contact */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: interpolate(shrink, [0, 1], [250, 92]),
          textAlign: "center",
          ...headline,
          fontSize: 230,
          scale: String(interpolate(shrink, [0, 1], [1, 0.5])),
          transformOrigin: "50% 0",
        }}
      >
        <Line start={2} dur={18}>Let&rsquo;s run</Line>
        <Line start={8} dur={18} style={{ color: C.yellow }}>
          your night.
        </Line>
      </div>

      {/* contact */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 370,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            padding: "20px 40px",
            borderRadius: 999,
            background: C.coral,
            color: C.ink,
            ...mono,
            fontSize: 30,
            letterSpacing: "0.14em",
            boxShadow: "0 20px 60px rgba(255,77,46,0.45)",
            opacity: p(f, LAND - 8, 8),
            scale: String(interpolate(p(f, LAND - 8, 18, BACK), [0, 1], [0.7, 1])),
          }}
        >
          Request a proposal on WhatsApp
        </div>
        <div style={{ ...headline, fontSize: 150, marginTop: 34, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
          <Line start={LAND - 2} dur={18}>+20 102 128 1660</Line>
        </div>
        <div style={{ ...mono, fontSize: 26, marginTop: 24 }}>
          <Line start={LAND + 6}>Moaz Moamen · Founder</Line>
        </div>
      </div>

      {/* sign-off bar */}
      <div
        style={{
          position: "absolute",
          left: 140,
          right: 140,
          top: 800,
          height: 2,
          background: "rgba(255,247,240,0.16)",
          scale: `${p(f, LAND, 30)} 1`,
          transformOrigin: "0 50%",
        }}
      />
      <div style={{ position: "absolute", left: 140, top: 842, display: "flex", alignItems: "center", gap: 30 }}>
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            overflow: "hidden",
            background: "#fff",
            scale: String(p(f, LAND, 18, BACK)),
            rotate: `${(1 - p(f, LAND, 24)) * -90}deg`,
            boxShadow: "0 0 0 4px rgba(255,214,10,0.9), 0 20px 40px rgba(0,0,0,0.4)",
          }}
        >
          <Img src={staticFile("img/logo.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", scale: "1.08" }} />
        </div>
        <div>
          <div style={{ ...headline, fontSize: 64 }}>
            <Line start={LAND + 4}>Joy Boy Agency</Line>
          </div>
          <div style={{ ...mono, fontSize: 22, marginTop: 12 }}>
            <Line start={LAND + 10}>Entertainment &amp; animation · Red Sea resorts</Line>
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", right: 140, top: 862, textAlign: "right" }}>
        <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 52, color: C.ink, letterSpacing: "-0.01em" }}>
          <Line start={LAND + 8}>joyboy-agency.com</Line>
        </div>
        <div style={{ ...mono, fontSize: 22, marginTop: 14 }}>
          <Line start={LAND + 14}>Marsa Alam · Hurghada · Sahl Hasheesh</Line>
        </div>
      </div>
    </AbsoluteFill>
  );
};
