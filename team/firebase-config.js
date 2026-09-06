// ── Joy Boy team portal: connection settings ──────────────────────────────
// 1. In the Firebase console create a project, add a Web app, and copy the
//    "firebaseConfig" values here. These keys are public identifiers, not
//    secrets: access is enforced by the security rules (see README.md).
// 2. Until real values are pasted the portal runs in DEMO mode: nothing is
//    saved anywhere except the visitor's own browser.
window.JB_FIREBASE = {
  apiKey: "PASTE_FROM_FIREBASE_CONSOLE",
  authDomain: "PASTE.firebaseapp.com",
  projectId: "PASTE",
  storageBucket: "PASTE.appspot.com",
  messagingSenderId: "PASTE",
  appId: "PASTE"
};
// Admin accounts (must match the list inside firestore.rules / storage.rules).
window.JB_ADMINS = [
  "seifabas33@gmail.com",
  "joyboyentertainmentagency@gmail.com"
  // , "moaz@gmail.com"   ← add Mr. Moaz's Gmail here and in both rules files
];
