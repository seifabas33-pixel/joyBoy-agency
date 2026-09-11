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
- Client record (owner-stated 2026-09-07): Casa Blue Beach Resort (Marsa Alam,
  2024–2025 seasons) and True Beach Resort (Marsa Alam, 2026 season) as Joy Boy
  engagements; before that the team ran the seasons at Solymar Reef Marsa and Jaz
  Grand Marsa (2021–2022) and Hilton Marsa Alam Nubian (2022–2023). The awards
  cards carry these seasons plus the owner's note that none of them was top-10 on
  arrival. Do not add further hotels without the owner.
- Guest quotes must be **verbatim**, dated, attributed and linked; only from
  periods when Joy Boy ran the programme (Casa Blue reviews after the 2025 season are NOT ours).
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
`team/README.md` (setup). **Before every team/ deploy run `python3 tools/bump-portal.py`**: it stamps `?v=` on the portal.js / portal.css / firebase-config.js references so a cached old script never runs against a new page (that mismatch shows up as a blank portal or "could not start"). Data model: `employees/{uid}` (status pending/
approved/rejected; admin-only fields status/reviewedBy/reviewedAt), office notes in `employees/{uid}/private/notes` (admin-only),
`settings/registration.inviteCode` (rules enforce it on create; the code is set from the admin page and must never be written into the repo). **Admins (2026-09-07)**: four built-in accounts hard-coded in config AND `isBuiltInAdmin()` in firestore.rules (Seif's two Gmail spellings, the agency Gmail, Mr. Moaz's; never removable) plus `admins/{email}` documents managed from the admin page (Hotels & office → Office accounts); `isAdminUser()` in portal.js checks both. Digest e-mails (10:30/20:30 Cairo) come from `tools/sheets-sync.gs sendDigest`. Portal is installable (`team/manifest.webmanifest`, `team/icons/`). API key referrer restriction was attempted 2026-09-07 and rolled back to None: with Websites set (github.io + firebaseapp.com + web.app + localhost, also with https:// variants) sign-in failed with auth/requests-from-referer-…-are-blocked and the auth handler showed "The requested action is invalid", even after >5 min. Next attempt: do it on a quiet day, add ONLY `seifabas33-pixel.github.io/*` and `joy-boy-agency.firebaseapp.com/*` first, wait 10 min, test; consider that the Identity Toolkit call may go through the auth iframe on firebaseapp.com. Never delete/rotate the key (it is baked into firebase-config.js). **Live since 2026-09-06**: rules published, invite code set from the admin page, registration + approval + both admins verified by the owner. Project: joy-boy-agency (Spark/free plan). **Personal data never goes
into git, screenshots, or chat logs**; demo data is clearly fake. Portal is
noindex (not robots-blocked, so the tag is honoured); privacy policy has a staff section. Entry for everyone: homepage menu → Join the team → `/team/`; admins get an Open-the-roster banner there; admin page has Share invite (link + code).

**Hotels + attendance (2026-09-06)**: `hotels/{id}` (name, city, lat, lng, cosLat, radiusM, shiftStart "HH:MM", graceMin, active; read signed-in, write admin), employee `hotelId` is admin-only, `attendance/{uid}_{YYYY-MM-DD}` (uid, email, name, hotelId, hotelName, date, checkInAt = server time, lat, lng, accuracy, distM, optional checkOutAt, admin `override` present/half-day/absent/excused/off + overrideBy). Rules enforce approved+assigned, geofence (equirectangular with cosLat), first check-in per day, checkOutAt once. Status rule lives in `portal.js attStatus` and is mirrored in `tools/sheets-sync.gs` (Apps Script that pulls Firestore via REST with the owner's OAuth token into the owner's Google Sheet, tabs "Attendance (portal)" / "Hotels (portal)"). Times are Africa/Cairo. Admin page tabs: Roster / Attendance (day view, overrides, month CSV) / Hotels (editor, paste Maps link or coordinates). **Decisions (2026-09-07)**: a late check-in (after start+grace) is flagged `review` by `attStatus` and shows "Late · needs decision" (falls back to Half day in exports); staff who cannot check in send a note to `requests/{uid}_{date}` (owner create once per day, admin decides). The Attendance tab lists both above the table with Present / Half day / Absent buttons; a decision writes the attendance `override` (+ `source`) and closes the request. Hotel radius under 200 m is warned against in the editor (owner had set 50 m on the first live day). **2026-09-08**: a staff member at True Beach (indoors, meeting area) got "check-in refused" from the rules although the page's own distance check passed; fix shipped: the page pre-checks the hotel entry (closed / incomplete pin), rules + page add the phone's GPS accuracy (cap 100 m) to the radius (`fenceDistM/fenceTolM/fenceProblem` in portal.js mirror `insideFence`), refusals show the numbers and pre-fill the office note, admin hotel editor has "How far am I from this pin?". Rules must be re-published in the console after this change. **Shifts (2026-09-08, owner: 3 shifts 09:45–12:30 / 14:45–16:30 / 20:00–23:00, check in+out per shift, per-shift location that changes daily)**: `hotels/{id}.shifts` (map s1..s4 {name,start,end,graceMin}, `DEFAULT_SHIFTS` fallback), `hotels/{id}.spots` (map key→{name,lat,lng,cosLat,radiusM}), `plans/{hotelId}_{date}.shifts.{sK}.spot` (admin writes from the Attendance tab), attendance per shift `attendance/{uid}_{date}_{sK}` (day docs `{uid}_{date}` remain office-only day marks; a legacy day check-in is shown as "old day format"), requests per shift `{uid}_{date}_{sK}`. Helpers in portal.js: `hotelShifts, hotelSpots, plannedSpot, currentShift, shiftStatus, dayStatus, dayLabel, SHIFT_DECISIONS`; rules `insideFence` checks the planned spot and requires `d.spot == planned key`. Sheet script mirrors it (per-shift columns); re-paste after changes. **Programme (2026-09-08)**: daily activities per hotel in `plans/{hotelId}_{date}.tasks` (id,time,end,title,place,placeKey,uids,names,all,note); admin tab Programme (add/edit/delete, copy yesterday, WhatsApp share via `programmeText`), staff card shows own items highlighted + tomorrow. Helpers `taskId, sortTasks, taskIsMine, programmeText`. **Pay & sales (2026-09-08)**: salary in `employees/{uid}/private/pay` {payType month|day, salary, currency EGP|USD|EUR; commission stays in the sales currency, `payrollCompute` returns mixed/baseNet, `netText` renders both} (drawer, admin-only); `settings/sales.items` (read signed-in; each item {prices {cur}, commissions {cur}} = guest price and seller commission per unit per currency (owner rule: disco 25 USD/20 EUR → 5 USD/5 EUR, lottery 4 USD → 1 USD, t-shirts like disco); sales store `amounts {cur}`, `units {cur}` (= amount ÷ price) and `commissions {cur}` (`normItem/unitsMap/commissionMap/saleAmounts/saleCommissions/sumMaps`); payroll `commissionAll`/`commissionOther` per currency, `moneyMap` helper); `sales/{uid}_{date}_{item}` {qty, amount, commission, note} admin-write, staff read own; `payroll/{uid}_{YYYY-MM}` {days, base, deducted, commission, adjustments[], net, status draft|paid} admin-write, staff read own when paid. Admin tab Pay & sales (Sales / Payroll / Items & commission); staff card Your sales + Payslips. Helpers `money, monthKey, monthRange, daysInMonth, salesItems, commissionOf, payrollCompute, PAY_DEDUCT, ADJ_LABEL`. Pay figures never leave Firestore (no sheet sync, no screenshots, no repo). **Schedule (2026-09-09)**: `plans/{hotelId}_{date}.roster[uid] = {off, shifts[]}` (no entry = all shifts); admin tab Schedule (week grid, Save week, Copy last week, reset); `scheduledShifts/isOffDay/weekStart/dayLabelShort` in portal.js; `dayStatus([])` = off; used by staff card, Attendance, decisions, payroll (`plansRange`) and sheets-sync.gs (`scheduledShifts` mirror). Backend `plansRange(from,to)`, `saveRoster`. **Security (2026-09-09)**: CSP meta on both team pages with hashed inline scripts, written by `tools/bump-portal.py` (run it after ANY change to an inline script or the policy breaks the page); hotels/plans/settings-sales read require `isApproved()`; gh-pages no longer carries team/README.md or the rules files; owner to-do: key referrer restriction, 2FA on admin accounts. **App Check parked 2026-09-09**: classic reCAPTCHA no longer accepted by the console, Enterprise needs Blaze; code hook ready in portal.js (`recaptchaSiteKey` empty = off; switch to `ReCaptchaEnterpriseProvider` when resuming), full runbook in team/README.md. **Today tab + edit check-in (2026-09-11)**: admin default view `today` (loadToday/paintToday, uses `attRows(day, recs, planMap)`), ✎ on shift cells opens `#edit` panel (`openEdit/saveEdit`, `fromCairo(dateKey, HH:MM)` in portal.js, fields editedBy/editedAt/editReason/source). Remember: any inline-script change needs `tools/bump-portal.py` (CSP hash) or the page will not start. **Sheet sync gotcha (2026-09-11)**: leftover data-validation dropdowns on "Attendance (portal)" made `setValues` throw (`violates the data validation rules`) and the sync wrote only the first row(s); `writeTab` now clears validations over the whole tab first, grows the tab if needed, normalises cells/row widths, catches per-row failures, and writes a "Sync report (portal)" tab (per person: in the sheet yes/no + reason + record count). **Push notifications (2026-09-11)**: FCM sent from Apps Script with the owner OAuth token (scope `firebase.messaging`, no Blaze); staff register a device in `employees/{uid}/devices/{id}` via "Turn on reminders" (needs `vapidKey` in firebase-config.js + `team/firebase-messaging-sw.js`; iPhone = Home screen install); office queues into `notify/{id}` (Today message box, Programme "Notify the team", payslip paid); `pushTick()` every 15 min sends shift reminders (~30 min before, only scheduled + not checked in, deduped in Script Properties) and drains the queue; `testPush()`/`installPushTriggers()`; config uses `self.` so the service worker can import it.

## Design direction the owner chose

Bold & playful: deep-aubergine dark base (light theme optional), saturated
palette (coral #FF4D2E, yellow #FFD60A, magenta #D63BC6 (solid; big surfaces use the logo gradient --magenta #F03FA8→#A03DE6, replaced the old pink #FF2D8A on 2026-09-07), violet #8B5CF6, aqua
#22E3C0), Bricolage Grotesque headlines at hero scale, colour-block cards,
energetic motion (overshoot reveals, wiggling sticker, pulsing play buttons),
spotlight hero (a tilted, drifting wall of programme photos under a dark stage, lit by a spotlight that follows the pointer or roams on its own; headline "We run the night." with a rotating word; ticket-shaped badge), newspaper masthead for "Our work". The earlier background video (`media/hero.mp4`) was removed on 2026-09-07 at the owner's request.
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
20. Performance → HTML ~120 KB, images as lazy files with width/height; the hero wall uses 480px copies in media/img/wall/ (~330 KB, second half of each column lazy); reels stay preload=none

Open items the owner knows about: Actions billing block; sensitive figures in
old git history (needs repo recreation); no analytics; custom domain not bought.
