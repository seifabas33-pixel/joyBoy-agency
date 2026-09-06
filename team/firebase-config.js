// ── Joy Boy team portal: connection settings ──────────────────────────────
// 1. In the Firebase console create a project, add a Web app, and copy the
//    "firebaseConfig" values here. These keys are public identifiers, not
//    secrets: access is enforced by the security rules (see README.md).
// 2. Connected to project joy-boy-agency on 2026-09-06. (With PASTE placeholders
//    the portal falls back to DEMO mode.)
window.JB_FIREBASE = {
  apiKey: "AIzaSyDNI7g2KzWYpSKwdRnoTRH7YbCDxl5g6ig",
  authDomain: "joy-boy-agency.firebaseapp.com",
  projectId: "joy-boy-agency",
  storageBucket: "joy-boy-agency.firebasestorage.app",
  messagingSenderId: "366857907850",
  appId: "1:366857907850:web:f81e450575760c77180773"
};
// Admin accounts (must match the list inside firestore.rules / storage.rules).
window.JB_ADMINS = [
  "seifabas33@gmail.com",
  "seif.abas33@gmail.com",
  "joyboyentertainmentagency@gmail.com"
  // , "moaz@gmail.com"   ← add Mr. Moaz's Gmail here and in both rules files
];
