// Backend layer for the Joy Boy team portal.
// Real mode: Firebase Auth (Google) + Firestore + Storage, loaded on demand.
// Demo mode (config not pasted yet): everything stays in this browser's localStorage.
const cfg = window.JB_FIREBASE || {};
export const DEMO = !cfg.apiKey || /PASTE/.test(cfg.apiKey);
export const ADMINS = (window.JB_ADMINS || []).map(e => e.toLowerCase());
export const isAdminEmail = e => !!e && ADMINS.includes(String(e).toLowerCase());
const FB = "https://www.gstatic.com/firebasejs/10.14.1/";

export async function initBackend(){
  return DEMO ? demoBackend() : firebaseBackend();
}

/* ─────────────── Firebase ─────────────── */
async function firebaseBackend(){
  const [{ initializeApp }, A, F] = await Promise.all([
    import(FB + "firebase-app.js"), import(FB + "firebase-auth.js"), import(FB + "firebase-firestore.js")]);
  const app = initializeApp(cfg);
  const auth = A.getAuth(app), db = F.getFirestore(app);
  const provider = new A.GoogleAuthProvider(); provider.setCustomParameters({ prompt: "select_account" });
  const user = u => u ? { uid: u.uid, email: u.email, name: u.displayName || "", photo: u.photoURL || "", verified: !!u.emailVerified } : null;
  try { await A.getRedirectResult(auth); } catch (e) { console.warn(e); }
  const ts = () => F.serverTimestamp();
  const clean = d => { const o = {}; for (const k in d){ if (d[k] instanceof Date) o[k] = F.Timestamp.fromDate(d[k]); else if (d[k] && d[k].toDate) o[k] = d[k].toDate().toISOString(); else o[k] = d[k]; } return o; };
  const plain = snap => { const d = snap.data(); for (const k of ["createdAt","updatedAt","reviewedAt"]) if (d[k] && d[k].toDate) d[k] = d[k].toDate().toISOString(); return d; };
  return {
    mode: "firebase",
    onUser: cb => A.onAuthStateChanged(auth, u => cb(user(u))),
    signIn: async () => { try { await A.signInWithPopup(auth, provider); } catch (e) {
        if (e.code === "auth/popup-closed-by-user" || e.code === "auth/cancelled-popup-request") return;           // user changed their mind - not an error
        if (e.code === "auth/popup-blocked") throw new Error("Your browser blocked the Google sign-in window. Allow pop-ups for this site (or open the page in Safari/Chrome instead of an in-app browser) and tap the button again.");
        if (e.code === "auth/unauthorized-domain") throw new Error("This web address is not authorised for sign-in yet. Tell the office.");
        throw e; } },
    signOut: () => A.signOut(auth),
    getProfile: async uid => { const s = await F.getDoc(F.doc(db, "employees", uid)); return s.exists() ? plain(s) : null; },
    createProfile: (uid, data) => F.setDoc(F.doc(db, "employees", uid), { ...clean(data), createdAt: ts(), updatedAt: ts() }),
    updateProfile: (uid, data) => F.updateDoc(F.doc(db, "employees", uid), { ...clean(data), updatedAt: ts() }),
    // Images are stored as data URLs in employees/{uid}/files/{name} (no Storage bucket needed on the free plan).
    uploadImage: async (uid, name, blob) => { const url = await blobToDataUrl(blob); if (url.length > 1000000) throw new Error("Image still too large after compression"); await F.setDoc(F.doc(db, "employees", uid, "files", name), { data: url, type: blob.type || "image/jpeg", size: blob.size, updatedAt: ts() }); return { path: `${uid}/${name}`, url }; },
    imageUrl: async path => { if (!path) return ""; const [uid, name] = path.split("/"); const s = await F.getDoc(F.doc(db, "employees", uid, "files", name)); return s.exists() ? s.data().data : ""; },
    deleteImage: async (uid, name) => F.deleteDoc(F.doc(db, "employees", uid, "files", name)),
    // admin
    listEmployees: async () => { const s = await F.getDocs(F.collection(db, "employees")); return s.docs.map(d => ({ uid: d.id, ...plain(d) })).sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))); },
    adminUpdate: (uid, patch) => F.updateDoc(F.doc(db, "employees", uid), { ...patch, reviewedAt: ts() }),
    getNotes: async uid => { const s = await F.getDoc(F.doc(db, "employees", uid, "private", "notes")); return s.exists() ? (s.data().text || "") : ""; },
    setNotes: (uid, text, by) => F.setDoc(F.doc(db, "employees", uid, "private", "notes"), { text, by, updatedAt: ts() }),
    deleteEmployee: async uid => { for (const f of ["avatar.jpg", "id.jpg"]) { try { await F.deleteDoc(F.doc(db, "employees", uid, "files", f)); } catch {} } try { await F.deleteDoc(F.doc(db, "employees", uid, "private", "notes")); } catch {} await F.deleteDoc(F.doc(db, "employees", uid)); },
    getSettings: async () => { const s = await F.getDoc(F.doc(db, "settings", "registration")); return s.exists() ? s.data() : {}; },
    setSettings: patch => F.setDoc(F.doc(db, "settings", "registration"), patch, { merge: true }),
  };
}

/* ─────────────── Demo (localStorage) ─────────────── */
function demoBackend(){
  const K = "jb-demo-", get = k => JSON.parse(localStorage.getItem(K + k) || "null"), set = (k, v) => localStorage.setItem(K + k, JSON.stringify(v));
  const listeners = [];
  const cur = () => get("user");
  const emit = () => listeners.forEach(cb => cb(cur()));
  const now = () => new Date().toISOString();
  const seed = () => { if (get("seeded")) return; const demo = [
    { uid: "demo-1", email: "demo.animator1@gmail.com", status: "approved", fullName: "Demo Animator One", preferredName: "Demo 1", gender: "Female", dob: "1998-05-14", nationality: "Egypt", languages: ["Arabic","English","German"], phone: "+20 100 000 0001", city: "Hurghada", skills: ["Dancer","Kids club","MC / host"], experienceYears: 4, payMethod: "InstaPay", availableFrom: "2026-10-01", contractPref: "Full season", tshirt: "S", createdAt: now(), updatedAt: now() },
    { uid: "demo-2", email: "demo.animator2@gmail.com", status: "pending", fullName: "Demo Animator Two", preferredName: "Demo 2", gender: "Male", dob: "1995-11-02", nationality: "Italy", languages: ["Italian","English"], phone: "+39 300 000 0002", city: "Marsa Alam", skills: ["DJ","Fitness & aqua gym","Light show"], experienceYears: 7, payMethod: "Bank transfer", availableFrom: "2026-11-15", contractPref: "Monthly", tshirt: "L", createdAt: now(), updatedAt: now() },
    { uid: "demo-3", email: "demo.animator3@gmail.com", status: "pending", fullName: "Demo Animator Three", preferredName: "Demo 3", gender: "Male", dob: "2001-02-20", nationality: "Egypt", languages: ["Arabic","English","Russian"], phone: "+20 100 000 0003", city: "Cairo", skills: ["Fire show","Dancer","Sports"], experienceYears: 2, payMethod: "Mobile wallet", availableFrom: "2026-10-10", contractPref: "Events only", tshirt: "M", createdAt: now(), updatedAt: now() }];
    demo.forEach(d => set("emp-" + d.uid, d)); set("emps", demo.map(d => d.uid)); set("settings", { inviteCode: "JOYBOY" }); set("seeded", true); };
  seed();
  return {
    mode: "demo",
    onUser: cb => { listeners.push(cb); setTimeout(() => cb(cur()), 0); },
    signIn: async () => { const isAdmin = !!window.JB_ADMIN_PAGE; const u = isAdmin ? { uid: "demo-admin", email: ADMINS[0] || "admin@gmail.com", name: "Demo Admin", photo: "", verified: true } : { uid: "demo-me", email: "you@gmail.com", name: "Demo Employee", photo: "", verified: true }; set("user", u); emit(); },
    signOut: async () => { localStorage.removeItem(K + "user"); emit(); },
    getProfile: async uid => get("emp-" + uid),
    createProfile: async (uid, data) => { set("emp-" + uid, { ...data, createdAt: now(), updatedAt: now() }); const ids = get("emps") || []; if (!ids.includes(uid)) { ids.push(uid); set("emps", ids); } },
    updateProfile: async (uid, data) => { set("emp-" + uid, { ...(get("emp-" + uid) || {}), ...data, updatedAt: now() }); },
    uploadImage: async (uid, name, blob) => { const url = await blobToDataUrl(blob); set("img-" + uid + "-" + name, url); return { path: `${uid}/${name}`, url }; },
    imageUrl: async path => { if (!path) return ""; const [uid, name] = path.split("/"); return get("img-" + uid + "-" + name) || ""; },
    deleteImage: async (uid, name) => localStorage.removeItem(K + "img-" + uid + "-" + name),
    listEmployees: async () => (get("emps") || []).map(id => get("emp-" + id)).filter(Boolean).sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "")),
    adminUpdate: async (uid, patch) => { set("emp-" + uid, { ...(get("emp-" + uid) || {}), ...patch, reviewedAt: now() }); },
    getNotes: async uid => (get("notes-" + uid) || {}).text || "",
    setNotes: async (uid, text, by) => set("notes-" + uid, { text, by, updatedAt: now() }),
    deleteEmployee: async uid => { ["emp-" + uid, "notes-" + uid, "img-" + uid + "-avatar.jpg", "img-" + uid + "-id.jpg"].forEach(k => localStorage.removeItem(K + k)); set("emps", (get("emps") || []).filter(x => x !== uid)); },
    getSettings: async () => get("settings") || {},
    setSettings: async patch => set("settings", { ...(get("settings") || {}), ...patch }),
  };
}

/* ─────────────── shared helpers ─────────────── */
export const LANGS = ["Arabic","English","German","Italian","Russian","French","Polish","Czech","Ukrainian","Spanish","Dutch","Romanian"];
export const SKILLS = ["Team Leader","Kids club","DJ","Dancer","Singer","Musician","Fitness & aqua gym","Sports","MC / host","Fire show","Light show","Costumes & props","Sound & light tech","Photo & video","Social media"];
export const NATIONS = ["Egypt","Italy","Germany","Russia","Ukraine","Poland","Czech Republic","Romania","Tunisia","Morocco","Turkey","Spain","France","Netherlands","United Kingdom","Other"];
export const PAY = ["Bank transfer","InstaPay","Mobile wallet","Cash"];
export function age(dob){ if (!dob) return ""; const d = new Date(dob), t = new Date(); let a = t.getFullYear() - d.getFullYear(); const m = t.getMonth() - d.getMonth(); if (m < 0 || (m === 0 && t.getDate() < d.getDate())) a--; return a; }
export const blobToDataUrl = blob => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => rej(new Error("read failed")); fr.readAsDataURL(blob); });
/** Shrink until the JPEG fits under maxBytes (Firestore documents are capped at 1 MiB, base64 adds ~33%). */
export async function shrinkToFit(file, max, q, maxBytes){
  let m = max, quality = q, blob = await shrink(file, m, quality);
  for (let i = 0; i < 6 && blob.size > maxBytes; i++){ m = Math.round(m * .8); quality = Math.max(.5, quality - .08); blob = await shrink(file, m, quality); }
  if (blob.size > maxBytes) throw new Error("Image is too detailed to compress; please use a smaller photo");
  return blob;
}
export function shrink(file, max = 900, q = .85){
  return new Promise((res, rej) => { const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => { const s = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement("canvas"); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); c.toBlob(b => b ? res(b) : rej(new Error("resize failed")), "image/jpeg", q); };
    img.onerror = () => rej(new Error("not an image")); img.src = url; });
}
export function toast(msg){ let t = document.querySelector(".toast"); if (!t){ t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); } t.textContent = msg; t.classList.add("show"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 2600); }
export function waNumber(phone){ let d = String(phone || "").replace(/\D/g, ""); if (!d) return ""; if (d.startsWith("00")) d = d.slice(2); else if (d.startsWith("0") && d.length === 11) d = "20" + d.slice(1); return d.length >= 8 ? d : ""; }
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export function completeness(p){ const keys = ["photoPath","fullName","gender","dob","nationality","phone","city","emergencyName","emergencyPhone","idType","idNumber","idExpiry","idScanPath","payMethod","skills","experienceYears","availableFrom","contractPref","tshirt","languages"]; const n = keys.filter(k => { const v = p[k]; return Array.isArray(v) ? v.length : (v !== undefined && v !== null && v !== ""); }).length; return Math.round(100 * n / keys.length); }
