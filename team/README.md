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
- Add Mr. Moaz's Gmail to the admin list in **two** places:
  `team/firebase-config.js` and `team/firestore.rules` (then re-publish the rules).
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
