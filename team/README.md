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

Run **`diagnose`** in Apps Script (function dropdown → diagnose → Run), then read the toast and Executions → View logs. It reports the date range the sync covers, how many staff should appear and why each one would be skipped (not approved, no hotel, hotel id not found, unreadable registration date), how many attendance documents exist and how many days carry records. `syncAttendance` is also defensive now: a row that fails is written with an "error:" day status instead of aborting the run, cells are normalised before the write (an undefined cell used to make Sheets reject the whole table), and the toast reports rows, days, assigned staff and record count.
