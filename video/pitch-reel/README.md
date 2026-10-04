# Joy Boy pitch reel (Remotion)

A 62-second, 1920×1080 pitch video for hotel managers, made in code with
[Remotion](https://www.remotion.dev). It uses the same footage, colours and
fonts as the website, so a change to the copy is a text edit plus a re-render.

## Make it

```console
npm i
npm run assets      # builds public/: clips, blurred plates, grain, fonts, music
npm run dev         # Remotion Studio preview
npm run render      # → out/joyboy-pitch-reel.mp4
```

`public/` and `out/` are generated and never committed: the footage already
lives in `../../media`, everything else is made by `tools/assets.sh`.

## How it is built

| Scene (frames) | File | Content |
| --- | --- | --- |
| 0–120 | `src/scenes/Open.tsx` | the website hero in motion: photo wall, roaming spotlight, "Admit all" ticket |
| 120–360 | `src/scenes/Hook.tsx` | "We run the night / kids club / theme nights / daytime line", footage cut on the beat |
| 360–660 | `src/scenes/Shows.tsx` | three shows side by side, then "No studio. No extras." over the after-show |
| 660–840 | `src/scenes/Team.tsx` | 7/7 nights, the four programme lines, one resident team |
| 840–1140 | `src/scenes/Proof.tsx` | Casa Blue #2 of 108 + award cards, then Solymar / Jaz / Hilton ranks |
| 1140–1440 | `src/scenes/Quote.tsx` | verbatim TripAdvisor quote (mdovetto, 30 Aug 2026) |
| 1440–1620 | `src/scenes/Method.tsx` | "Nothing runs on hope." — plan, register, programme, report |
| 1620–1860 | `src/scenes/Cta.tsx` | "Let's run your night." + WhatsApp proposal line, logo, domain |

- **Music** (`tools/music.py`) is synthesised from scratch (120 BPM, A minor),
  so nothing is licensed. One beat = 15 frames; every cut sits on a beat and the
  arrangement (drop, breakdown under the quote, final hit on the logo) follows
  the scene list above. Normalised to −14 LUFS. To use a licensed track
  instead, replace `public/music.wav` (keep 120 BPM or move the cuts).
- **Copy rules** are the website's: no prices, no internal figures, guest
  quotes verbatim with name, platform, hotel and date, the client record only
  as in CLAUDE.md.
- `tools/stills.mjs` renders single frames for checks:
  `node tools/stills.mjs 150 960 1745` → `out/stills/`.
- `remotion.config.ts` uses the Playwright headless shell in `/opt/pw-browsers`
  when it exists (cloud sessions); elsewhere Remotion downloads its own.

## Licence

Remotion is free for individuals and companies with up to 3 employees; larger
for-profit companies need a Remotion Company License
(https://www.remotion.pro/license). Fonts: Bricolage Grotesque, Instrument
Sans, IBM Plex Mono (SIL Open Font License).
