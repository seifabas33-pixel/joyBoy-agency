import { fitText } from "@remotion/layout-utils";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { BgClip, Card, Clip, Line, Photo, Shade } from "../components";
import { C, HEAD, headline, mono, p } from "../theme";

// "We run the ___." — the word changes on the beat and so does the footage.
// Each entry: [first frame, word, card media, caption].
type Beat = {
  from: number;
  word: string;
  media: { clip: string; at: number } | { photo: string; position: string };
  caption: string;
};

const BEATS: Beat[] = [
  { from: 0, word: "night.", media: { clip: "reel-egypt.mp4", at: 4.4 }, caption: "Echo of Egypt Night" },
  { from: 60, word: "kids club.", media: { clip: "reel-kids.mp4", at: 0.2 }, caption: "Kids programme" },
  { from: 105, word: "theme nights.", media: { clip: "reel-theme.mp4", at: 1.6 }, caption: "Theme night parade" },
  {
    from: 150,
    word: "daytime line.",
    media: { photo: "img/gallery-daytime-line.jpg", position: "38% 50%" },
    caption: "The daytime line",
  },
  { from: 195, word: "night.", media: { clip: "reel-fire.mp4", at: 16.4 }, caption: "Fire show" },
];
const END = 240;
const WORD_W = 1080;

export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* footage: blurred plate + sharp card, one pair per beat */}
      {BEATS.map((b, i) => {
        const next = BEATS[i + 1]?.from ?? END;
        return (
          <Sequence key={b.from} from={b.from} durationInFrames={next - b.from + 12} premountFor={fps} name={b.caption}>
            <Beat beat={b} />
          </Sequence>
        );
      })}

      <Shade side="left" strength={0.9} />

      {/* type */}
      <div style={{ position: "absolute", left: 140, top: 250 }}>
        <div style={{ ...headline, fontSize: 150 }}>
          <Line start={0} dur={16}>We run the</Line>
        </div>
        <div style={{ position: "relative", height: 260, marginTop: 6 }}>
          {BEATS.map((b, i) => {
            const next = BEATS[i + 1]?.from;
            const { fontSize } = fitText({ text: b.word, withinWidth: WORD_W, fontFamily: HEAD, fontWeight: 800, letterSpacing: "-0.035em" });
            return (
              <div key={b.from} style={{ position: "absolute", left: 0, bottom: 0 }}>
                <div style={{ ...headline, fontSize: Math.min(250, fontSize), color: C.yellow, whiteSpace: "nowrap" }}>
                  <Line start={b.from === 0 ? 5 : b.from} dur={14} out={next === undefined ? undefined : next - 7} outDur={7}>
                    {b.word}
                  </Line>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 56, fontFamily: HEAD, fontWeight: 600, fontSize: 64, color: C.ink, letterSpacing: "-0.01em" }}>
          <Line start={204} dur={18}>So your guests write the reviews.</Line>
        </div>
      </div>

      {/* the underline that grows under the closing line */}
      <div
        style={{
          position: "absolute",
          left: 140,
          top: 832,
          height: 8,
          width: 900 * p(f, 214, 18),
          borderRadius: 4,
          background: C.magenta,
        }}
      />
    </AbsoluteFill>
  );
};

const Beat: React.FC<{ beat: Beat }> = ({ beat }) => {
  const f = useCurrentFrame();
  const reveal = p(f, 0, 12);
  const m = beat.media;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: p(f, 0, 8) }}>
        {"clip" in m ? (
          <BgClip src={m.clip} at={m.at} />
        ) : (
          <Photo src={m.photo} position={m.position} style={{ filter: "blur(40px) brightness(0.42) saturate(1.35)", scale: "1.2" }} />
        )}
      </AbsoluteFill>
      <Card x={1240} y={128} w={540} h={830} rotate={2.5} reveal={reveal}>
        {"clip" in m ? <Clip src={m.clip} at={m.at} /> : <Photo src={m.photo} position={m.position} zoom={[1.05, 1.18]} dur={60} />}
        <div
          style={{
            position: "absolute",
            left: 24,
            bottom: 24,
            padding: "10px 16px",
            borderRadius: 12,
            background: "rgba(13,10,20,0.72)",
            ...mono,
            fontSize: 22,
            color: C.ink,
            opacity: p(f, 8, 12),
          }}
        >
          {beat.caption}
        </div>
      </Card>
    </AbsoluteFill>
  );
};
