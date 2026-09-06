# Joy Boy Agency — project memory for Claude

Joy Boy Agency runs entertainment & animation departments for Red Sea resorts
(Egypt). Owner: Seif Abas (co-founder). Founder: Moaz Moamen. This repo is the
agency's public website and pitch material. **The repo is public.**

## What is live, and how to deploy

GitHub Pages serves the **`gh-pages` branch** (Actions is blocked on this
account; the workflow in `.github/workflows/pages.yml` is dormant).

| Live URL | Source on `main` |
| --- | --- |
| `/` (homepage) | `portfolio.html` |
| `/anjum.html` | `anjum-dashboard.html` (noindex, historical pitch; carries a brand strip linking back to `/`) |
| `/portfolio.html` | tiny redirect to `/` (old shared link) |
| `/de.html`, `/it.html` | generated from `portfolio.html` by `scratchpad/i18n.py` (dictionaries DE/IT inside; rerun after any English copy change; keep the script copy in `tools/i18n.py`) |
| `/legal.html`, `/404.html`, `/robots.txt`, `/sitemap.xml` | same-named files |
| `/team/` | `team/` (staff portal, see section below; copy the whole folder) |
| `/media/**` | `media/` (videos) and `media/img/` (photos, posters, icons) |

Deploy = commit on `main`, then on `gh-pages`: `git show main:portfolio.html >
index.html`, copy `de.html`, `it.html` and the other files, commit, push. Pushes sometimes stall through
the proxy: use `timeout 50 git push` with retries. Always verify
`git diff --quiet main:portfolio.html origin/gh-pages:index.html`.

## Hard rules (never break)

- No Joy Boy internal figures anywhere public: payroll, lottery/disco/merch
  revenue, margins. No prices on the portfolio (prices only in per-hotel proposals).
- Client record is **only** Casa Blue Beach Resort (Marsa Alam, 2024 season) and
  True Beach Resort (Marsa Alam, 2026 season). Never imply others.
- Guest quotes must be **verbatim**, dated, attributed and linked; only from
  periods when Joy Boy ran the programme (Casa Blue reviews after 2024 are NOT ours).
- Contacts: Moaz +20 102 128 1660 (WhatsApp, proposal requests), Seif
  +20 100 157 0273 / seifabas33@gmail.com, joyboyentertainmentagency@gmail.com,
  Instagram @joyboyentertainment. No crew personal details, no contracts.
- Clients must not be able to edit anything (no contenteditable).
- Languages: EN (source) / DE / IT. Any English copy change must be mirrored
  in the DE/IT dictionaries and both files regenerated before deploy.
- Verify visually with headless Chromium before deploying; block Google Fonts
  in test shots (`--host-resolver-rules`) or the run hangs.

## Team portal (staff app) — `team/`

Static pages on Pages + **Firebase** (Google sign-in, Firestore; NO Storage — Blaze-only on new projects, images are data URLs in `employees/{uid}/files/{avatar.jpg|id.jpg}`, `photoThumb` 128px in the main doc). Files:
`team/index.html` (register/edit profile, 5 steps), `team/admin.html` (roster,
approve/reject, notes, CSV, invite code), `team/portal.js` (backend layer,
demo mode when `firebase-config.js` still has PASTE placeholders),
`team/firestore.rules` + `team/storage.rules` (paste into the console),
`team/README.md` (setup). Data model: `employees/{uid}` (status pending/
approved/rejected; admin-only fields status/reviewedBy/reviewedAt), office notes in `employees/{uid}/private/notes` (admin-only),
`settings/registration.inviteCode` (rules enforce it on create; the code is set from the admin page and must never be written into the repo). Admin emails are hard-coded in config AND
firestore.rules — keep the two lists identical (four accounts as of 2026-09-06: Seif's two Gmail spellings, the agency Gmail, Mr. Moaz's). **Live since 2026-09-06**: rules published, invite code set from the admin page, registration + approval + both admins verified by the owner. Project: joy-boy-agency (Spark/free plan). **Personal data never goes
into git, screenshots, or chat logs**; demo data is clearly fake. Portal is
noindex (not robots-blocked, so the tag is honoured); privacy policy has a staff section. Entry for everyone: homepage menu → Join the team → `/team/`; admins get an Open-the-roster banner there; admin page has Share invite (link + code).

**Hotels + attendance (2026-09-06)**: `hotels/{id}` (name, city, lat, lng, cosLat, radiusM, shiftStart "HH:MM", graceMin, active; read signed-in, write admin), employee `hotelId` is admin-only, `attendance/{uid}_{YYYY-MM-DD}` (uid, email, name, hotelId, hotelName, date, checkInAt = server time, lat, lng, accuracy, distM, optional checkOutAt, admin `override` present/half-day/absent/excused/off + overrideBy). Rules enforce approved+assigned, geofence (equirectangular with cosLat), first check-in per day, checkOutAt once. Status rule lives in `portal.js attStatus` and is mirrored in `tools/sheets-sync.gs` (Apps Script that pulls Firestore via REST with the owner's OAuth token into the owner's Google Sheet, tabs "Attendance (portal)" / "Hotels (portal)"). Times are Africa/Cairo. Admin page tabs: Roster / Attendance (day view, overrides, month CSV) / Hotels (editor, paste Maps link or coordinates).

## Design direction the owner chose

Bold & playful: deep-aubergine dark base (light theme optional), saturated
palette (coral #FF4D2E, yellow #FFD60A, pink #FF2D8A, violet #8B5CF6, aqua
#22E3C0), Bricolage Grotesque headlines at hero scale, colour-block cards,
energetic motion (overshoot reveals, wiggling sticker, pulsing play buttons),
video hero with a fan of photo cards, newspaper masthead for "Our work".
Reference reels the owner shared: hero-section styles (Gallery / Masthead) and
the pre-launch checklist below. Preloader with the logo must always show
(including under reduced motion). Everything must work on phones.

## Pre-launch checklist (owner asked to keep this in mind — check on every change)

1. Privacy policy → `legal.html#privacy`
2. Terms page → `legal.html#terms`
3. Clear CTA → "Let's talk" + "Request a proposal on WhatsApp"
4. FAQ → section 08 on the portfolio (+ FAQPage JSON-LD)
5. robots.txt → present (allows all, disallows /anjum.html)
6. sitemap.xml → present (root + legal)
7. Custom 404 → `404.html`
8. Alt text → every image has descriptive alt
9. Analytics → **none installed** (needs owner's account; privacy page must be updated if added)
10. Meta titles → descriptive `<title>` per page
11. Meta description → present
12. Social share → og:image (`media/img/og.jpg`) + twitter card
13. Favicon → `media/img/favicon-64.png` + apple-touch-icon
14. Canonical URLs → root canonical on the portfolio
15. Cookie consent → not needed: no cookies, no tracking; theme stored in localStorage only (documented in privacy)
16. Mobile → verify at 500px width in every change
17. Accessibility → skip link, landmarks, aria-labels, focus management in the lightbox, reduced-motion support, contrast
18. Test forms → no forms; WhatsApp/tel/mailto links must be checked
19. Broken links → run the link check (anchors, media, external) before deploy
20. Performance → HTML ~105 KB, images as lazy files with width/height; hero video trimmed to a 36 s loop at 432px/24fps (1.9 MB, from 4.9 MB); reels stay preload=none

Open items the owner knows about: Actions billing block; sensitive figures in
old git history (needs repo recreation); no analytics; custom domain not bought.
