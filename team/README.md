# Joy Boy team portal — setup (one-time, ~20 minutes)

The portal (`/team/`) lets staff register with their Google account and keep a
profile: identity, document, payment method, skills, availability, photo.
Admins (`/team/admin.html`) review, approve and export. Code is static and
lives on GitHub Pages; **data lives in Firebase**, never in this repository.

Until Firebase is connected the pages run in **demo mode** (banner shown,
nothing saved beyond the visitor's own browser).

## 1. Create the Firebase project (Google account of the agency)
1. https://console.firebase.google.com → **Add project** → name `joyboy-team`
   (Analytics can stay off) → Create.
2. **Build → Authentication → Get started → Sign-in method → Google → Enable**
   (set the support email) → Save.
3. Still in Authentication → **Settings → Authorized domains → Add domain**:
   `seifabas33-pixel.github.io` (add the custom domain later if you buy one).
4. **Build → Firestore Database → Create database** → production mode →
   location `eur3 (europe-west)` → Enable.
   Then **Rules** tab → replace everything with the contents of
   `team/firestore.rules` → Publish.
5. ~~Storage~~ — **not needed.** New projects require the paid Blaze plan for
   Storage, so photos and document scans are saved inside Firestore
   (`employees/{uid}/files/avatar.jpg|id.jpg`, compressed on the phone to
   stay well under the 1 MB document limit). `storage.rules` is kept only for
   reference.
6. Firestore → **Start collection** `settings` → document id `registration` →
   field `inviteCode` (string) = a **random** code of at least 8 letters/digits that you
   will give staff (never reuse an example from any document; change it after each
   recruiting wave from the admin page).
   (Only admins can read it; the rules check it on every registration. You can
   also change it later from the admin page.)
7. **Project settings (gear) → General → Your apps → Web (</>)** → nickname
   `portal` → Register → copy the `firebaseConfig` object.

## 2. Connect the site
- Paste the values into `team/firebase-config.js` (the six fields).
- **Built-in admins** are listed in two places that must stay identical:
  `team/firebase-config.js` and `isBuiltInAdmin()` in `team/firestore.rules`.
  They can never be locked out. **Further admins** are added from the admin page
  (Hotels & office → Office accounts), which writes `admins/{email}`; no code or
  rules change needed. Google reports the account's exact spelling, so a dotted
  Gmail (`first.last@`) is a different id from the undotted one.
- Deploy as usual (copy `team/` to `gh-pages`).

## 3. Test
1. Open `/team/` in a private window, sign in with a Gmail that is *not* an
   admin, complete the five steps with the invite code → status Pending.
2. Open `/team/admin.html` with an admin Gmail → the profile appears → Approve.

## What is stored, and who can see it
| Data | Employee | Admins |
| --- | --- | --- |
| Name, gender, DOB, nationality, phone, city, languages, skills, availability | own | all |
| ID/passport number, expiry, document photo (Firestore `files/id.jpg`) | own | all |
| Payment method and account details | own | all |
| Status | read | write |
| Office notes (`employees/{uid}/private/notes`) | no access | read/write |

Everything is protected by the security rules above; the config keys in
`firebase-config.js` are public identifiers by design. The free Firestore tier
(1 GiB stored, 50k reads/day) covers a few hundred staff with photos.

## Legal
Egypt's Personal Data Protection Law applies to this data. The form collects
explicit consent (including for optional medical notes), the privacy policy at
`/legal.html#privacy` describes the processing, and employees can ask for
correction or deletion: the admin page has **Delete profile…** which removes the
profile, both images and the office notes. The Google sign-in record itself
holds only the email address; remove it under Authentication → Users if asked.
Keep CSV exports off shared drives and delete them after use.

## Hotels, assignments and attendance (added 2026-09-06)

- **Hotels** (admin page → Hotels tab): name, town, location (paste a Google Maps
  link or "lat, lng", or "Use my current location" while standing there), allowed
  radius in metres, shift start time, grace minutes, active flag. Stored in
  `hotels/{id}` with a precomputed `cosLat` so the security rules can check the
  distance themselves.
- **Assignment**: Roster → open a person → *Hotel assignment*. Writes `hotelId`
  on the employee document (admin-only field).
- **Check-in** (employee page, approved staff with a hotel): one tap reads the
  phone's GPS once, the browser checks the distance, and the document
  `attendance/{uid}_{YYYY-MM-DD}` is created with a **server** timestamp. The
  rules refuse the write unless the person is approved, assigned to that hotel,
  inside the radius and it is the first check-in of the day. Check-out adds one
  more server timestamp. Nothing else about location is ever stored.
- **Status rule** (same code in `portal.js`, the admin page and the Sheets
  script): checked in by shift start + grace → Present; later → Half day; no
  check-in after that time → Absent. Admins can override any day (present, half
  day, absent, sick, vacation, excused, day off); the override wins everywhere.
- **Google Sheet**: `tools/sheets-sync.gs` (setup steps at the top of the file)
  pulls the last 62 days into a tab "Attendance (portal)" in your own sheet,
  on demand from a "Joy Boy" menu or hourly. The same menu has *Import this
  month tab into the portal*: it reads the owner's hand-kept monthly grid (names
  in column B, one column per day, letters P/H/A/S/V/O/E) and writes each marked
  day into `attendance/` as a manual override, matching stage names to
  `preferredName`/`fullName` (or a mapping tab "Portal names": sheet name →
  email). The admin page also has *Export month CSV*.
- **Decisions**: a check-in after start + grace is recorded but flagged *Late ·
  needs decision*; staff who cannot check in (GPS, radius) send a note to
  `requests/{uid}_{date}` from the same card. Both appear at the top of the
  admin Attendance tab with Present / Half day / Absent buttons; a decision
  writes the attendance override and closes the request. Undecided late
  check-ins fall back to Half day in exports.
- Limits worth knowing: browser GPS can be spoofed by a determined person, so
  the check-in is evidence, not proof; accuracy indoors can be 50–100 m, so set
  the radius generously (300–800 m for a resort). Times are Egypt time.

## Hardening the Firebase key (10 minutes, console only)

The web API key in `firebase-config.js` is public by design, but it should only
work from our own addresses. In the Google Cloud console (project
*joy-boy-agency*) → **APIs & Services → Credentials** → the key named
"Browser key (auto created by Firebase)":

1. **Application restrictions** → *Websites* → add
   `seifabas33-pixel.github.io/*`, `joy-boy-agency.firebaseapp.com/*`,
   `joy-boy-agency.web.app/*` and `localhost/*` (for demo/testing).
2. **API restrictions** → *Restrict key* → tick **Identity Toolkit API**,
   **Token Service API** and **Cloud Firestore API**. Save.

If sign-in stops working afterwards, a referrer is mistyped: open the key again
and compare against the list above. Changes take up to five minutes to apply.

## Office digest e-mails

`tools/sheets-sync.gs` → Joy Boy menu → *Install twice-daily digest*: at about
10:30 and 20:30 Egypt time every office account (built-in + `admins/`) gets an
e-mail with pending registrations, late check-ins and requests that need a
decision, and who has not checked in yet. Needs the `script.send_mail` scope in
`appsscript.json` (see the header of the script).

## Installable app

`team/manifest.webmanifest` + `team/icons/` make the portal installable
("Add to Home Screen"). It then opens full-screen in the system browser, which
also avoids the Instagram in-app browser and its blocked pop-ups.

### Check-in refused although the person is at the hotel (2026-09-08)

- The staff page now checks the hotel entry before it tries (closed hotel, missing pin/radius) and, when the server still refuses, shows the numbers the server saw (metres from the pin, GPS accuracy, allowed radius) and pre-fills the note to the office with them.
- Rules and page allow the phone's reported GPS accuracy on top of the radius, capped at 100 m, because a phone indoors (meeting room, backstage) is often 50–100 m off.
- Admin → Hotels → open the hotel → **How far am I from this pin?** shows, from where the admin stands, the distance the server will compute and whether a check-in would pass. Use it standing where the staff check in.
- If a hotel card says "closed" or "Location incomplete", staff assigned to it are refused; reopen or re-save the hotel.

### Shifts, spots and the daily plan (2026-09-08)

- **Shifts**: each hotel has up to four shifts (default Morning 09:45–12:30, Afternoon 14:45–16:30, Evening 20:00–23:00, grace 5 min), edited in Hotels & office → open the hotel → Shifts. Staff check in **and** out for every shift; the button on their card follows the current shift (opens 90 min before the start, closes 30 min after the end).
- **Spots**: named places in the resort with their own pin and radius (Beach, Theatre, Terrace…), added in the hotel editor (stand there and tap "Use my current location"). Stored inside the hotel document (`hotels/{id}.spots`).
- **Plan**: Attendance tab → the card "Where does each shift check in on …" → pick a spot per shift → Save plan (`plans/{hotelId}_{date}`). Staff see "Morning · 09:45–12:30 · at the Beach" and must be inside that spot's radius; without a plan the whole hotel radius applies. "Same as yesterday" copies yesterday's plan into the selects.
- **Records**: `attendance/{uid}_{date}_{s1..s4}` per shift (uid, email, name, hotelId, hotelName, date, shift, shiftName, spot, spotName, checkInAt, lat, lng, accuracy, distM, checkOutAt, override). Whole-day marks by the office (sick, vacation, off, grid import) stay in `attendance/{uid}_{date}`. Notes from staff are per shift: `requests/{uid}_{date}_{shift}`.
- **Status**: per shift Present / Late · needs decision / Absent; the day is Present when every shift was attended, Half day when some, Absent when none; a day mark wins. Decisions per shift: Present / Excused / Absent. Same logic in `tools/sheets-sync.gs` (tab "Attendance (portal)" now has per-shift columns; re-paste the script).
- **Rules**: `insideFence()` reads the plan for the day and checks the record against the planned spot (the record must carry the same `spot` key) or the hotel; the phone's GPS accuracy (max 100 m) is added to the radius. Re-publish `firestore.rules` after this change.

### Daily programme (2026-09-08)

- Admin → **Programme** tab: pick the day and hotel, add activities (start, until, activity, place = a spot or free text, who = staff chips or Everyone, note). Edit / Delete per row, **Copy yesterday**, **Share on WhatsApp** (plain text of the day).
- Stored in the same document as the shift plan: `plans/{hotelId}_{date}.tasks` = `[{id, time, end, title, place, placeKey, uids, names, all, note}]` (+ `tasksBy`, `tasksAt`). `savePlan` and `saveTasks` both merge, so shifts and tasks never overwrite each other. No rules change needed (plans: read signed-in, write admin).
- Staff card "Programme": today's activities with their own highlighted (yellow frame, "You"), the next one framed green, past ones dimmed, a "Whole team" toggle, and tomorrow's programme collapsed underneath as soon as the office enters it.

### Pay & sales (2026-09-08)

- **Salary**: Roster → open a person → *Salary* (monthly salary or daily rate, in EGP, USD or EUR; commission stays in the sales currency and is shown next to the salary net when the currencies differ) → `employees/{uid}/private/pay` (admin-only).
- **Items & commission**: Pay & sales → *Items & commission* → `settings/sales.items` `[{key,name,unit,price,commissionPct,commissionUnit}]` (readable by signed-in staff so their card can show commission). Items carry a price and a seller commission per unit **per currency** (`prices {USD:25, EUR:20}`, `commissions {USD:5, EUR:5}`; owner's rule 2026-09-09: Disco tour 25 USD / 20 EUR → 5 USD / 5 EUR, Lottery 4 USD → 1 USD, T-shirts like the disco tour). A sale line stores the cash per currency (`amounts`), the units derived per currency (`units` = amount ÷ price) and the commission per currency (`commissions`), so the seller is paid in the currency the guest paid (`normItem`, `unitsMap`, `commissionMap`, `saleAmounts`, `saleCommissions`, `sumMaps`). Defaults: Lottery, T-shirts, Disco tour, commission 0 until set. Sales, month totals, payroll commission and payslips are summed per currency (`sumByCur`, `moneyMap`); the net shows the salary currency plus any other commission currencies side by side.
- **Sales**: Pay & sales → *Sales*: day + hotel, person, item, quantity, amount collected (auto = qty × price, editable), note → `sales/{uid}_{date}_{item}` with the commission stored. One line per person, item and day; saving again replaces it. Month summary per person × item below the day list.
- **Payroll**: Pay & sales → *Payroll*: month; per person the salary, days Present / half / absent (from attendance, `dayStatus` per day; sick/vacation/excused/off are paid), base (monthly: salary − absent × salary/days-in-month − half × ½; daily: rate × days worked), commission, adjustments (+ bonus / − advance / − deduction, with note), net. **Mark paid** writes `payroll/{uid}_{YYYY-MM}` with `status: "paid"` and frozen numbers; the person then sees the payslip on their card (rules: own + paid only). Reopen sets it back to draft. CSV export.
- Staff card *Your sales*: this month's sales per item and commission; *Payslips* lists paid months with the breakdown.
- Rules: `sales` and `payroll` are admin-write; staff read their own sales, and payroll only when paid. **Re-publish `firestore.rules`.** Payroll is not synced to the Google Sheet (keep pay data inside the portal).

### Schedule / days off (2026-09-09)

- Admin → **Schedule** tab: week view per hotel (Mon–Sun), one row per approved person, a letter button per shift and an **off** button per day. Nothing marked = the person works every shift (the default until now). Save week writes `plans/{hotelId}_{date}.roster = { uid: { off: true, shifts: [] } | { shifts: ["s1","s3"] } }` (merge; spots and programme in the same document are untouched). Copy last week; "Everyone, all shifts" clears the week.
- `scheduledShifts(hotelShifts(hotel), plan, uid)` is used everywhere a person's shifts matter: staff card (only their shifts; "Today is your day off"; "Tomorrow: …"; a 7-day strip when a schedule exists), admin Attendance (unscheduled cells show "off", Expected/Off today stats), decisions, payroll day counts (`plansRange` for the month) and the Sheets script (sync + digest). `dayStatus` with no scheduled shifts → `off` (paid on a monthly salary, not worked on a daily rate).
- No rules change (plans: read signed-in, write admin).

### Security posture (checked 2026-09-09 against the owner's checklist)

- **Keys**: the Firebase web config in `firebase-config.js` is a public identifier by design; access is enforced by `firestore.rules`. No tokens or secrets in the repo or its history (checked); the invite code lives only in Firestore.
- **Access**: Google sign-in with verified e-mail only; admins = built-in list in rules + `admins/{email}`; staff read only their own profile, attendance, sales and paid payslips; hotels, plans and sales items readable by **approved** staff only; day marks, notes, salaries, payroll, settings admin-only; `/{document=**}` denied.
- **Admin page**: the HTML is public, the data is not — every read/write is checked by the rules, the client-side admin check only decides what to show.
- **Sanitising / XSS**: every user-provided string that enters HTML goes through `esc()`; links are validated (`https?://`, WhatsApp digits only); images are data URLs restricted by the rules to `data:image/*`.
- **CSP**: both portal pages carry a `Content-Security-Policy` meta (scripts only from self, gstatic and apis.google.com plus SHA-256 hashes of the two inline scripts; connections only to Firebase/Google endpoints; frames only the Firebase auth domain and Google). `tools/bump-portal.py` recomputes the hashes on every deploy — never edit an inline script without running it. GitHub Pages cannot send headers, so HSTS/X-Frame-Options are what GitHub provides.
- **Exposed files**: the live site no longer serves `team/README.md` or the rules files (they stay in the repo, which is public anyway). No debug output, no `console.log`.
- **Not applicable / accepted**: no passwords (Google handles them), no server (no env vars, CORS or rate limiting of our own — Firestore quotas apply). Dependencies: Firebase JS SDK pinned at 10.14.1 from gstatic; upgrade on a quiet day and re-test sign-in.
- **Still to do (owner)**: Firebase **App Check** (reCAPTCHA) to stop other apps using the web key; API key referrer restriction (see the runbook above); keep the admin Google accounts on 2-step verification.

### App Check — parked (2026-09-09)

Attempted: classic reCAPTCHA v3 key created, but the Firebase console no longer accepts classic keys (field locked, "deprecated, use reCAPTCHA Enterprise"). Enterprise needs billing on the project (Blaze; reCAPTCHA Enterprise free up to 10k assessments/month). The portal code is ready: `portal.js` starts App Check when `firebase-config.js` has a `recaptchaSiteKey`; the CSP already allows the reCAPTCHA hosts. **To finish later**: (1) Firebase → Upgrade to Blaze, set a budget alert; (2) Google Cloud console → reCAPTCHA → Create key → Website, domains `seifabas33-pixel.github.io` and `joy-boy-agency.firebaseapp.com`, score-based, no challenge; (3) Firebase → App Check → Apps → web app → reCAPTCHA Enterprise → paste the Enterprise **site key** → Save; (4) in `portal.js` switch `ReCaptchaV3Provider` to `ReCaptchaEnterpriseProvider`, put the site key in `firebase-config.js`, bump + deploy; (5) after a day of "Verified" traffic in App Check → APIs, press Enforce for Cloud Firestore only.

### Today tab + check-in corrections (2026-09-11)

- **Today** is the first tab and the default view: stats (expected, in the current shift, missed check-ins, decisions, sales lines), a "to decide" strip with a button to the Attendance tab, one card per hotel with each shift's in/expected count, planned spot and the names not in yet, the day's programme (upcoming first) and today's sales. Refresh button; hotel filter.
- **Correct a check-in**: every shift cell in the Attendance table has a ✎. It opens a small panel to set the check-in and check-out times (Cairo time, converted with `fromCairo`), with a required reason; "Remove check-in" clears the times. Writes `checkInAt/checkOutAt` (+ `editedBy`, `editedAt`, `editReason`, `source: manual|edited`) to `attendance/{uid}_{date}_{shift}`; the cell shows an "edited" tag with the reason as tooltip. Adding a check-in on a shift with no record creates the record (admin write).

### When the sheet shows fewer people than expected (2026-09-11)

Every sync now writes a **"Sync report (portal)"** tab: one line per registered person with Status, Hotel, *In the sheet* yes/no, the reason when it is no (profile not approved, no hotel assigned, hotel id not found), the registration date and how many attendance records that person has in the synced range. The last lines give the range, the number of records and the number of days with records. Read that tab first — it separates "the person is filtered out" from "the records were not fetched". `diagnose` in Apps Script (function dropdown → diagnose → Run), then read the toast and Executions → View logs. It reports the date range the sync covers, how many staff should appear and why each one would be skipped (not approved, no hotel, hotel id not found, unreadable registration date), how many attendance documents exist and how many days carry records. `syncAttendance` is also defensive now: a row that fails is written with an "error:" day status instead of aborting the run, cells are normalised before the write (an undefined cell used to make Sheets reject the whole table), and the toast reports rows, days, assigned staff and record count.

**Root cause found 2026-09-11**: the attendance tab carried leftover **data validation** dropdowns (e.g. "S3 spot" only allowed "theatre, beach"). `clearContents()` does not remove validation rules, so every sync threw `The data you entered in cell V2 violates the data validation rules` at `setValues` and the write aborted after the first rows — which is why the tab held a single person. `writeTab` now calls `clearDataValidations()` over the whole tab (and grows the tab if it is too small) before writing, and if the tab still refuses the data it is deleted and recreated clean, then written again — so no leftover rule can break a sync. Every toast starts with the script version (`SCRIPT_VERSION`), so you can always tell which copy the sheet is running. Never put dropdowns or validation on the portal-written tabs; they belong to the script.

### Push notifications (2026-09-11)

Firebase Cloud Messaging, sent from the sheet script with the owner's own Google account — **no Blaze plan, no server, no service-account key**.

- **Staff**: a "Turn on reminders" button under the attendance card (`pushState()` in portal.js, `be.enablePush/disablePush`). It asks for permission, registers `team/firebase-messaging-sw.js` and stores the token in `employees/{uid}/devices/{deviceId}` (one doc per phone, stable id in localStorage). On iPhone the portal must be added to the Home screen first — web push only works there from the installed app.
- **Office**: Today tab → "Send a message" (everyone or one hotel); Programme tab → "Notify the team" sends the day's list; marking a payslip paid notifies that person. All of these write to `notify/{id}` (admin-only).
- **Sending**: `pushTick()` in `tools/sheets-sync.gs` runs every 15 minutes (install with `installPushTriggers`, or the Joy Boy menu). It (1) reminds scheduled staff ~30 min before a shift they have not checked into, naming the planned spot, deduplicated per hotel/day/shift via Script Properties, and (2) drains the `notify` queue and stamps `sentAt`. Dead tokens are deleted automatically. `testPush()` sends a test to every registered phone.
- **Office phones**: admin page → Today → "Reminders on this phone" stores the token in `officeDevices/{deviceId}` (admin-only), separate from staff devices. The office is pushed when a staff member sends a "could not check in" note (once per note, `notifiedAt`), and `testPush()` goes **only** to office phones so a test never disturbs the team. `testPushToStaff()` sends to one person via a named range `TEST_EMAIL`.
- **Setup**: Firebase console → Project settings → Cloud Messaging → Web configuration → **Generate key pair**, then the public key goes into `firebase-config.js` as `vapidKey`. Add `https://www.googleapis.com/auth/firebase.messaging` to `appsscript.json` and re-authorise. Messages are data-only so the service worker decides wording, icon and the link.
- `firebase-config.js` now uses `self.` instead of `window.` so the service worker can import the same file. CSP allows the FCM endpoints and `worker-src 'self'`.

### Guest feedback QR (2026-09-11)

A guest scans a QR card on the table, rates the evening and — if they want — writes a line. Nothing to install, no app, no guest account.

- **Guest page**: `team/feedback.html`, public and `noindex`. Three languages (English / Deutsch / Italiano, picked from the browser and switchable with the chips), 5 stars, an optional comment (max 600 characters) and an optional first name. **The wording covers the whole stay, not only the night** (owner, 2026-09-13): *"How is your holiday going?"* with a lead naming the shows, the daytime and the kids club, so a guest can scan at the pool at noon as sensibly as after the show — the card on an animator's badge is seen all day. Mirrored in the German and Italian dictionaries and on the printed QR card. It reads `?h=<hotelId>` and, on a personal card, `&s=<uid>&n=<FirstName>` so the page can say "You are rating Gaia".
- **How it writes**: the page signs in **anonymously** (Firebase Auth → Sign-in method → **Anonymous** must be enabled) and creates one `feedback/{id}` document. The rules accept only that shape: rating 1-5, a comment under 600 characters, `createdAt == request.time`, nothing else. Guests can never read anything back — no roster, no attendance, no pay. The only public document in the whole project is `publicHotels/{id}` (hotel display name + the review link), written by the admin page.
- **After rating**, every guest is shown the hotel's public review link (TripAdvisor / Google), whatever they gave. We do **not** hide the link from unhappy guests: review gating is against Google's and TripAdvisor's policies and can get a hotel's reviews removed.
- **Admin page → Guests**: month + hotel filter, the four numbers (ratings, average, share of five stars, how many wrote something), "Who the guests name" (per staff member: ratings and average — from the personal cards), the list of what they wrote, and **Print a QR card**: pick the hotel and optionally a person, the QR is drawn locally (`team/qr.js`, vendored qrcode-generator, MIT — CSP only allows scripts from our own site), Print gives a card to cut out, "Copy the link" gives the plain URL for WhatsApp.
- **Printing a card (fixed 2026-09-13)**: the print rule hides every direct child of `<body>`, and the card sits deep inside one of them — an ancestor at `display:none` takes its whole subtree with it, so `Print` produced a blank page. The button now **clones the card into `#printarea`, a direct child of body**, and only that is shown; `body.printing::before` is also hidden (the page's background glow is a pseudo-element and survived the rule). The class is removed on `afterprint`, with a 3-second fallback because Safari on iOS does not always fire it.
- **Review link per hotel**: Hotels & office → the hotel → "Guest review link". Saving a hotel mirrors name + link into `publicHotels/{id}`.
- Guest comments are guest words: quote them on the website only verbatim, with the name and date as written (same rule as the site's testimonials).

### Light / dark screen (2026-09-12)

The morning shift reads the portal outdoors in full sun, where the dark theme is unreadable.

- The topbar has a button that cycles **Auto → Light → Dark**. The choice is kept in `localStorage` (`jb-theme`) on that phone only.
- **Auto** (the default, so nobody has to touch it) is light from 06:00 to 18:00 on the phone's own clock and dark after that. It re-checks every 10 minutes, so an open page flips itself at sunset.
- The theme is applied by a small inline script in the `<head>` of `team/index.html` and `team/admin.html` — before the page paints, so there is no dark flash. It also rewrites the `theme-color` meta so the phone's status bar matches. **It is an inline script: run `python3 tools/bump-portal.py` after touching it or the CSP hash stops matching and the page will not start.**
- `team/feedback.html` (the guest card) has no button: it follows the guest's own phone (`@media (prefers-color-scheme:light)` on `:root:not([data-theme])`).
- In CSS everything goes through tokens. Light values live in one block (`:root[data-theme="light"]`, mirrored in the media query). Pale accent text (`#FFE97A`, `#9DF2E0`, …) became `--t-warn`, `--t-ok`, `--t-bad`, `--t-violet`, `--t-orange`, `--t-sick`, `--t-blue`, with darker values in light mode; the topbar, the drawer backdrop and the background glows are `--topbar`, `--overlay`, `--glow-a/b`. **Never hard-code a light-on-dark colour again** — add a token, or light mode breaks.

### A day off you take away comes back (fixed 2026-09-12)

The office set someone to **off** for a day, then wanted to put them back on shift (the DJ was sick and he was replacing him). Tapping **off** cleared it on screen, **Save week** reported success — and the day off was still there after the reload.

Cause: `saveRoster` wrote the plan document with `setDoc(..., { merge: true })`. Firestore's `merge` melts **maps together key by key**, so removing somebody from the `roster` map does not remove them in the database: the old `{off: true}` entry survives the write and comes back on the next read. Setting a day off worked (a new key), changing which shifts worked (an overwritten key) — only *removing* an entry silently did nothing.

Fixed by writing those documents with **`mergeFields`** instead, which replaces the listed fields whole and leaves the rest of the document alone: `saveRoster` (roster), `savePlan` (shift spots), `saveTasks` (programme) and `saveHotel` (`spots` and `shifts` maps — deleting a spot in the hotel editor had the same problem). The day's programme and the spot plan in the same document are untouched by a roster save, as before.

**Rule for anything new**: `merge: true` is only safe for documents of flat fields. The moment a field is a map whose keys can disappear (roster, spots, shifts), use `mergeFields` with the exact list of fields being written. Demo mode replaces the whole field, so a demo test will never show this — reason about the Firestore side.

### Reminders for programme items (2026-09-13)

Besides the shift reminder, `pushTick()` now also reminds the people named on a **programme item** (admin page → Programme) **15 minutes before it starts** (`TASK_BEFORE`).

- Who gets it: the people named on the item; an item ticked **everyone** goes to the hotel's staff who are **scheduled that day**. Anyone marked off is never reminded (`taskPeople`).
- What it says: `18:00 · Lottery Fame` / "Starts in 15 minutes at the theatre." plus the item's note if there is one. The place comes from the item's own text, or from the hotel spot when the item was pinned to one.
- Once per item per day, locked in Script Properties (`task_<date>_<hotel>_<taskId>`), same as the shift reminder.
- **Testing**: Joy Boy menu → **Reminders: test a programme item** (`testTaskPush`). It takes today's next item (or the closest one if the day is over), ignores the clock and the once-a-day lock, and sends the real reminder to exactly the people it would normally reach. The toast names them. If nobody on the item has a phone registered, or nobody on it is scheduled, the toast says which of the two it is instead of failing silently.
- The script must be **re-pasted into Apps Script** after this change (`SCRIPT_VERSION` in every toast tells you which copy is running).

### The office sees check-ins as they happen (2026-09-13)

`pushTick` now tells the **office phones** (the ones registered on the admin page → Today → "Reminders on this phone") whenever someone checks in — so the owner can follow the floor from anywhere.

- One person: *"Checked in: Chocolate — Chocolate · Afternoon · 15:02 · 12 min late"*. Several in the same 15-minute window: *"3 just checked in"* with one line each.
- "x min late" is counted from the shift start plus that shift's grace, the same rule the Attendance tab uses.
- **Speed (2026-09-14)**: the owner found a 15-minute lag useless for "who just walked in". Check-ins now have their own one-minute job, `checkinTick()`, installed by `installPushTriggers()` alongside the quarter-hourly `pushTick`. A quiet minute costs **one** Firestore call: `queryWhere("attendance", "date", today)` reads only today instead of downloading the whole collection, the hotel names and shift times come from a half-hour cache in Script Properties (`cachedHotels`), and the office devices are only fetched when somebody has actually arrived. `pushTick` still calls the same function, so the office is covered even if the fast trigger is missing — both share the `seenCheckIn` marker, so nothing is ever announced twice. `pushTick` now uses the filtered query too. Keep an eye on the Apps Script quota (90 minutes of trigger runtime a day on a free account): a quiet tick is well under a second, but if executions start failing, drop `checkinTick` to `everyMinutes(5)`.
- Only check-ins **newer than the previous tick** are sent, tracked by one Script Property (`seenCheckIn`). On the very first run after this update the marker is set to "now" and nothing older is replayed — the office does not get a burst of the whole day.
- No office phone registered → nothing is sent and nothing fails.
- Staff phones are never involved here; this goes only to the office.

### Proposals — one page per hotel we pitch (2026-09-13)

Admin page → **Proposals**. Fill in the hotel, the season, the team, what we would run, what is included and the budget, then **Save & publish the link**. The hotel opens `team/proposal.html?p=<token>` on any phone — no account, nothing to install — and finds a branded page ending in "Talk to Moaz on WhatsApp". **Send on WhatsApp** hands you the message with the link already in it.

- **Where the prices live.** Nowhere on the public website, exactly as the house rule says — only in that one hotel's page, behind a 24-character random token (`proposalToken`). Treat the link like the price itself: whoever holds it sees that hotel's budget. **Unpublish** in the list deletes the public copy, and the link dies immediately.
- **Two documents, not one.** `proposals/{id}` is the working record and is admin-only; `publicProposals/{token}` is the trimmed copy the hotel reads, built by `proposalPublic()` — which copies only the agreed fields, so the **office note never leaves the office** (there is a test for exactly that). Publishing again overwrites the public copy with `mergeFields`.
- Defaults come from `PROPOSAL_INCLUDED` and `PROPOSAL_PROGRAMME` in portal.js, which are the same promises the public site makes. Change them there and every new proposal starts from the new wording.
- The page is `noindex, nofollow`, follows the reader's phone for light/dark, prints cleanly (the buttons drop out), and was checked down to 360px wide.
- **Rules must be re-published**: `proposals` (admin only) and `publicProposals` (`allow read: if true`, admin write).
- Gotcha for the next person: `portal.css` sets `table{min-width:860px}` for the admin's scrollable tables — any table outside a `.tablewrap` needs `min-width:0` or it will push a phone page sideways.

### Two more alerts for the office phone (2026-09-15)

- **An unhappy guest, within the minute.** A rating of **1 or 2 stars** (`BAD_RATING`) is pushed to the office phones as it arrives, with the comment, the guest's name and the staff member it named — because that guest is still at the resort and the evening can still be saved. Four and five stars are never pushed; they are counted in the Guests tab and the digest. Runs inside `checkinTick` (`tellOfficeAboutBadRatings`), tracked by the `seenFeedback` Script Property, which is stamped on the first run so nothing old is replayed. Between midnight and 04:00 it also scans yesterday's date, because a guest's phone may be on another timezone when it writes `date`.
- **"Who is not on the floor."** At the shift start **plus that shift's grace**, and within `MISSING_WINDOW` (20 minutes) of it, the office gets one message per hotel and shift: *"Afternoon shift · 2 missing — 1 of 3 checked in at True Beach Resort · missing: Nathali, Chocolate"*. People marked sick, on vacation or excused for the day are not counted as missing, and if everybody is in, nothing is sent — silence still means all good. Once per shift per day (`miss_<date>_<hotel>_<shift>`), from `pushTick`, so it lands within a quarter of an hour of the grace running out.

Deliberately **not** pushed: happy ratings, new registrations, payslips marked paid. A phone that buzzes for everything stops being read, and these two are the ones worth reading.

### "The server refused the check-in" now says why (2026-09-27)

A new animator could not check in while everyone else at the same hotel and shift could: her phone's own distance check passed, the rules refused, and the screen only said "the server refused". The office could not tell which of the rules' conditions had failed.

- On a refusal the page now calls `be.diagnoseCheckIn(attempt)`, which re-reads — **from the server, not the cache** (`getDocFromServer`) — every fact `approvedAt` and `insideFence` look at, in the same order: her profile (exists? approved? which hotel?), the hotel (open? has this shift? complete pin?), today's plan (readable? which spot is planned for this shift, and is it the one her phone sent?), the distance by the server's own formula and tolerance, and an existing record on that shift (already checked in? an office mark without a `shift` field, which blocks the update path?).
- The first reason is shown on her screen, and **all of them are written into the pre-filled note**, so the office sees the exact cause in the Attendance tab without asking for a screenshot.
- A failed read of her own attendance record is **not** taken as evidence of an office mark: the rules also deny reading a record that does not exist yet, so only what is actually visible is reported. When nothing on her side is wrong, it says so and points the office at the Attendance tab.
- The re-read of the plan just before checking in no longer swallows its error silently (it logs it; the diagnosis reports it if it mattered).

### Root cause of the "server refused" for the new animator (2026-09-28)

It was **not** the server. Her phone was blocking location for the portal. The browser reports that as *"Location permission was refused"*, and the check-in handler decided "server refusal" with `/permission|denied/i` — the word *permission* matched, so she was shown "The server refused the check-in" for a phone setting. The tell-tale signs, for next time: **no distance numbers in the message and an empty note** — both only exist once the phone has produced a location.

- A server refusal is now recognised only by Firestore's own code (`ex.code === "permission-denied"` / "Missing or insufficient permissions"), never by a word in a message. Location errors carry `locationBlocked`.
- A blocked location now says where the switch is on that phone — iPhone: *Settings → Privacy & Security → Location Services → Safari Websites → While Using the App*; Android: *lock icon → Permissions → Location → Allow* — and pre-fills the office note with "my phone was blocking location for the portal".
- Once a site has been refused location on an iPhone, Safari does not ask again; the switch has to be flipped in Settings.

### When a phone will not give its location: the note is the check-in (2026-09-29)

Some phones cannot be made to share their location with the portal (a Safari or Screen Time restriction the owner can't lift, a damaged GPS). No website can override that. For those people the "Could not check in?" note is the fallback, and it now works like a proper check-in the office confirms:

- The note reaches the office phone **within a minute** (`tellOfficeAboutNotes`, now also on `checkinTick`; `notifiedAt` stops a note being announced twice): *"Can't check in: Hania · Morning — … tap to decide."*
- Pressing **Present** on the note in the Attendance tab records **the time the note was sent from the hotel as the check-in time** (`checkInAt` = the note's `createdAt`), tagged edited with the reason *"Confirmed by the office from the staff note (no GPS on the phone)"*. An existing check-in is never overwritten. Excused / Absent behave as before.
- The office keeps control: nothing counts until someone in the office accepts it.

### Two bugs found through the same animator (2026-09-29)

- **Messages were invisible in daylight.** `.toast` used `color: var(--dark)` on `background: var(--ink)`; since the light theme (2026-09-12) `--ink` is dark in daytime, so every message from 06:00 to 18:00 was near-black on black (contrast 1.05:1) — the "black blob" in the staff screenshots. Now `color: var(--bg)` (16.8:1 light, 18.5:1 dark), a real box up to the screen width instead of a narrow pill, on screen for as long as its length needs (3–15 s, was a flat 2.6 s), and a tap closes it.
- **Checkout refused after the office marked a check-in by hand.** The ✎ edit wrote `checkOutAt: null` when no check-out time was given, and the rules only allowed a checkout when `checkOutAt` was *absent*. Fixed on both sides: `setAttendance` turns `null` into `deleteField()`, and the rules treat a null `checkOutAt` / `checkInAt` as not set (which also repairs the records already written that way). **Rules must be re-published.**

### Hotel code — check in without GPS (2026-09-30)

For a phone whose location will not work (the case above). **Admin → Today → Hotel code** turns the office phone
into a code screen: a 6-digit code, a new one every 60 seconds, the screen stays on. The staff member stands next
to the office phone; after their GPS check-in fails, a **"Location not working?"** box appears under the check-in
button, they type the code and are checked in (the time is the server's, as always).

- `checkinCodes/{hotelId}` {code, prev, hotelId, hotelName, setBy, setAt = server time} — **admin only**. Staff never
  read it; the rules compare the typed code with `get()` (`codeOk`): the current code works for 90 s after `setAt`,
  the previous one for 30 s more (so a code typed just as it changes still counts). **Stop and close** deletes the
  doc, so no code works while the screen is off — that also limits guessing to the minutes the screen is open.
- The attendance record carries `method: "code"` and `code`; `atHotel()` in the rules takes the code path instead
  of the geofence (hotel open + shift exists + approved + assigned + first check-in still apply). The planned spot
  is not required with a code. Shown as "hotel code" in Attendance, in the edit panel, on the staff card and in the
  office check-in alert (`tellOfficeAboutCheckIns`, script 2026-09-30a).
- Only admins can show a code (owner, 2026-09-30: no team-leader role yet). Adding one later = a staff flag the
  rules check on `checkinCodes` writes.
- **Rules must be re-published** after this change, or the code screen says "Could not set the code".

### Roll call — "Where is everyone?" (2026-09-30)

The owner wanted to know where staff are during a shift (some disappear without permission). A website cannot
track a phone in the background, and GPS inside a hotel is ±50–100 m, so this is an on-demand roll call, not live tracking.

- **Admin → Today → 📍 Where is everyone?** (choose the hotel first if there are several): everyone scheduled on
  the hotel's current shift, minus people with a day mark (sick/vacation/…), gets a push (`notify` lane "now",
  tag `rollcall`, link `team/?rc=1`). Writes `rollcalls/{rollId}` (admin record: uids, names, windowMin 10,
  radiusM, askedBy, status open/closed) and `rollcallNow/{hotelId}` (the pointer staff phones read with one get;
  rule: approved and assigned to that hotel).
- **Staff card:** a highlighted box "Roll call from the office" with the hotel's **spots** (from Hotels) + "Somewhere
  else in the hotel", **I'm here** or **Busy — in a show / with guests**. One GPS fix is taken with the answer
  (none if the phone blocks location → "no location"). `rollcallAnswers/{rollId}_{uid}`: created once, only while
  that roll call is the hotel's current one and < 120 min old, only by someone it was sent to.
- **Office card** (Today): counts, a **board** with one tile per hotel spot and the names of who chose it (plus
  Outside the hotel / No answer / Busy tiles; ⚠ = GPS far from the chosen spot), and a list: At the hotel / Busy / Outside the hotel (distance) / No
  answer after 10 min / No location. Refreshes itself every 15 s while answers are open.
- **Summary push:** `tellOfficeAboutRollCalls` (one-minute job) closes each roll call after its 10 minutes and sends
  the office phones one line: who is outside, who did not answer.
- **Check-out location:** check-out now takes one quick fix (never blocks the check-out) → `outLat/outLng/outAccuracy/outDistM`.
  Attendance flags "left N min early" and "checked out X km from the hotel".
- **Office messages now go out within a minute:** every `notify` doc is written with `lane: "now"` and sent by
  `sendQueuedNow` on the one-minute trigger (`pushTick` only picks them up if that job has been silent for 5 minutes).
- Privacy policy (staff section) says roll calls exist and that location is never read outside the person's shifts.
- **Re-publish the rules and re-paste the script** (`2026-09-30b`) after this change.

  *2026-09-30, after the first real roll call:* the first version drew a map from the GPS fixes. At True Beach it
  misled the owner (spots 20–40 m apart, ±50–100 m indoor GPS: dots on top of spots, labels pushed off, one person
  pushed across the hotel line). Replaced by the board; the GPS fix is only used for "outside the hotel" and the ⚠ check.
