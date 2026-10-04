import { AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Line } from "../components";
import { BACK, C, EXPO, HEAD, headline, mono, p } from "../theme";

// The platforms' own record. Part A: Casa Blue (our seasons 2024–2025).
// Part B: the three resorts the team ran before. Figures as on the website.
const SPLIT = 150;

export const Proof: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Sequence durationInFrames={SPLIT} premountFor={fps} name="Casa Blue">
        <CasaBlue />
      </Sequence>
      <Sequence from={SPLIT} premountFor={fps} name="Earlier seasons">
        <Earlier />
      </Sequence>
    </AbsoluteFill>
  );
};

const countDown = (f: number, start: number, from: number, to: number, dur = 36) =>
  Math.round(interpolate(f, [start, start + dur], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EXPO }));

const AWARDS = [
  { src: "img/award-tripadvisor-casa-blue.jpg", w: 380, h: 440, x: 880, y: 250, rot: -6, at: 26 },
  { src: "img/award-booking-2025.jpg", w: 360, h: 363, x: 1170, y: 400, rot: 3, at: 34 },
  { src: "img/award-holidaycheck-2025.jpg", w: 330, h: 415, x: 1450, y: 230, rot: 8, at: 42 },
];

const CasaBlue: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{ background: "radial-gradient(circle 900px at 75% 55%, rgba(34,227,192,0.16), transparent 70%)" }}
      />
      <div style={{ position: "absolute", left: 140, top: 190 }}>
        <div style={{ ...mono, fontSize: 28, color: C.aqua }}>
          <Line start={0}>TripAdvisor · Marsa Alam</Line>
        </div>
        <div style={{ ...headline, fontSize: 380, marginTop: 10, fontVariantNumeric: "tabular-nums" }}>
          <Line start={0} dur={12}>
            #{countDown(f, 2, 108, 2)}
          </Line>
        </div>
        <div style={{ ...headline, fontSize: 84, fontWeight: 700, marginTop: -10 }}>
          <Line start={12}>of 108 hotels.</Line>
        </div>
        <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 56, color: C.yellow, marginTop: 40, letterSpacing: "-0.01em" }}>
          <Line start={22}>Casa Blue Beach Resort</Line>
        </div>
        <div style={{ ...mono, fontSize: 26, marginTop: 18 }}>
          <Line start={28}>Our seasons · 2024–2025</Line>
        </div>
      </div>
      {AWARDS.map((a) => {
        const t = p(f, a.at, 22, BACK);
        return (
          <div
            key={a.src}
            style={{
              position: "absolute",
              left: a.x,
              top: a.y,
              width: a.w,
              height: a.h,
              borderRadius: 22,
              overflow: "hidden",
              rotate: `${a.rot + (1 - t) * 14}deg`,
              translate: `${(1 - t) * 260}px ${(1 - t) * 520 + interpolate(f, [0, SPLIT], [0, -26])}px`,
              opacity: p(f, a.at, 6),
              boxShadow: "0 40px 80px rgba(0,0,0,0.55), 0 0 0 1.5px rgba(255,255,255,0.12)",
            }}
          >
            <Img src={staticFile(a.src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 900, top: 840, ...mono, fontSize: 24, color: C.ink2, letterSpacing: "0.1em" }}>
        <Line start={56}>TripAdvisor 4.9 · Booking.com 9.9 · HolidayCheck Award 2025</Line>
      </div>
    </AbsoluteFill>
  );
};

const HOTELS = [
  { name: "Solymar Reef Marsa", img: "img/crop-solymar.jpg", rank: 3, of: 79, seasons: "2021–2022", pos: "50% 45%" },
  { name: "Jaz Grand Marsa", img: "img/crop-jaz.jpg", rank: 4, of: 79, seasons: "2021–2022", pos: "50% 50%" },
  { name: "Hilton Marsa Alam Nubian", img: "img/crop-hilton.jpg", rank: 9, of: 93, seasons: "2022–2023", pos: "50% 60%" },
];

const Earlier: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 140, top: 150, ...mono, fontSize: 28, color: C.aqua }}>
        <Line start={0}>Before that, our team ran the seasons at</Line>
      </div>
      {HOTELS.map((h, i) => {
        const s = 6 + i * 8;
        const t = p(f, s, 22);
        return (
          <div
            key={h.name}
            style={{
              position: "absolute",
              left: 140 + i * 560,
              top: 230,
              width: 520,
              height: 560,
              borderRadius: 28,
              overflow: "hidden",
              background: C.surface,
              boxShadow: "0 40px 80px rgba(0,0,0,0.45), inset 0 0 0 1.5px rgba(255,255,255,0.08)",
              opacity: p(f, s, 8),
              translate: `0 ${(1 - t) * 160}px`,
            }}
          >
            <div style={{ position: "relative", height: 230, overflow: "hidden" }}>
              <Img
                src={staticFile(h.img)}
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: h.pos, scale: String(interpolate(f, [0, 150], [1.12, 1.0])) }}
              />
            </div>
            <div style={{ padding: "26px 36px" }}>
              <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 40, color: C.ink, letterSpacing: "-0.01em" }}>{h.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 6 }}>
                <div style={{ ...headline, fontSize: 150, color: C.yellow, fontVariantNumeric: "tabular-nums" }}>
                  #{countDown(f, s + 4, h.of, h.rank, 30)}
                </div>
                <div style={{ ...mono, fontSize: 22, letterSpacing: "0.1em", lineHeight: 1.5 }}>
                  of {h.of}
                  <br />
                  in Marsa Alam
                </div>
              </div>
              <div style={{ ...mono, fontSize: 22, color: C.ink3, marginTop: 14, letterSpacing: "0.1em" }}>
                Our seasons · {h.seasons}
              </div>
            </div>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: 140, top: 860, fontFamily: HEAD, fontWeight: 700, fontSize: 64, color: C.ink, letterSpacing: "-0.02em" }}>
        <Line start={64}>
          None of them was in the <span style={{ color: C.yellow }}>top 10</span> when we arrived.
        </Line>
      </div>
      <div
        style={{
          position: "absolute",
          left: 140,
          top: 952,
          width: 1640 * p(f, 74, 30),
          height: 2,
          background: "rgba(255,247,240,0.18)",
        }}
      />
      <div style={{ position: "absolute", left: 140, top: 972, ...mono, fontSize: 20, color: C.ink3, letterSpacing: "0.1em", opacity: p(f, 80, 20) }}>
        Rankings as listed on TripAdvisor, Marsa Alam
      </div>
    </AbsoluteFill>
  );
};
