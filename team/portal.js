// Backend layer for the Joy Boy team portal.
// Real mode: Firebase Auth (Google) + Firestore + Storage, loaded on demand.
// Demo mode (config not pasted yet): everything stays in this browser's localStorage.
const cfg = window.JB_FIREBASE || {};
export const DEMO = !cfg.apiKey || /PASTE/.test(cfg.apiKey);
export const ADMINS = (window.JB_ADMINS || []).map(e => e.toLowerCase());
export const isAdminEmail = e => !!e && ADMINS.includes(String(e).toLowerCase());   // built-in list (synchronous)
/** Built-in list OR an entry in admins/{email}. Use this one for access decisions. */
export async function isAdminUser(be, email){ if (isAdminEmail(email)) return true; try { return await be.isListedAdmin(email); } catch { return false; } }
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
    // hotels (any signed-in user reads; admins write)
    listHotels: async () => { const s = await F.getDocs(F.collection(db, "hotels")); return s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => String(a.name).localeCompare(String(b.name))); },
    getHotel: async id => { if (!id) return null; const s = await F.getDoc(F.doc(db, "hotels", id)); return s.exists() ? { id: s.id, ...s.data() } : null; },
    saveHotel: async (id, data) => { const ref = id ? F.doc(db, "hotels", id) : F.doc(F.collection(db, "hotels")); await F.setDoc(ref, { ...data, updatedAt: ts() }, { merge: true }); return ref.id; },
    deleteHotel: id => F.deleteDoc(F.doc(db, "hotels", id)),
    // daily plan: which spot each shift checks in at — plans/{hotelId}_{date}
    getPlan: async (hotelId, date) => { const s = await F.getDoc(F.doc(db, "plans", `${hotelId}_${date}`)); return s.exists() ? att(s) : null; },
    savePlan: (hotelId, date, shifts, by) => F.setDoc(F.doc(db, "plans", `${hotelId}_${date}`), { hotelId, date, shifts, setBy: by, setAt: ts() }),
    // attendance: one document per person, day AND shift, id = uid_YYYY-MM-DD_s1; day marks by the office live in uid_YYYY-MM-DD. The server stamps the time.
    checkIn: async rec => { const id = `${rec.uid}_${rec.date}_${rec.shift}`; await F.setDoc(F.doc(db, "attendance", id), { ...rec, checkInAt: ts() }, { merge: true }); const s = await F.getDoc(F.doc(db, "attendance", id)); return att(s); }, // merge: keeps an office mark (override) that already exists for the shift
    checkOut: async id => { await F.updateDoc(F.doc(db, "attendance", id), { checkOutAt: ts() }); const s = await F.getDoc(F.doc(db, "attendance", id)); return att(s); },
    myAttendance: async (uid, from) => { const s = await F.getDocs(F.query(F.collection(db, "attendance"), F.where("uid", "==", uid))); return s.docs.map(att).filter(r => !from || r.date >= from).sort((a, b) => b.date.localeCompare(a.date)); },
    attendanceOn: async date => { const s = await F.getDocs(F.query(F.collection(db, "attendance"), F.where("date", "==", date))); return s.docs.map(att); },
    attendanceRange: async (from, to) => { const s = await F.getDocs(F.query(F.collection(db, "attendance"), F.where("date", ">=", from), F.where("date", "<=", to))); return s.docs.map(att).sort((a, b) => a.date.localeCompare(b.date)); },
    setAttendance: (id, patch) => F.setDoc(F.doc(db, "attendance", id), { ...patch, reviewedAt: ts() }, { merge: true }),
    deleteAttendance: id => F.deleteDoc(F.doc(db, "attendance", id)),
    // requests: "I could not check in" — written from anywhere, decided by the office
    sendRequest: async rec => { const id = `${rec.uid}_${rec.date}_${rec.shift}`; await F.setDoc(F.doc(db, "requests", id), { ...rec, status: "open", createdAt: ts() }); const s = await F.getDoc(F.doc(db, "requests", id)); return att(s); },
    myRequests: async (uid, date) => { const s = await F.getDocs(F.query(F.collection(db, "requests"), F.where("uid", "==", uid), F.where("date", "==", date))); return s.docs.map(att); },
    requestsOn: async date => { const s = await F.getDocs(F.query(F.collection(db, "requests"), F.where("date", "==", date))); return s.docs.map(att); },
    openRequests: async () => { const s = await F.getDocs(F.query(F.collection(db, "requests"), F.where("status", "==", "open"))); return s.docs.map(att).sort((a, b) => b.date.localeCompare(a.date)); },
    decideRequest: (id, patch) => F.updateDoc(F.doc(db, "requests", id), { ...patch, decidedAt: ts() }),
    // office accounts (admins/{email})
    isListedAdmin: async email => { const s = await F.getDoc(F.doc(db, "admins", String(email || "").toLowerCase())); return s.exists(); },
    listAdmins: async () => { const s = await F.getDocs(F.collection(db, "admins")); return s.docs.map(d => ({ email: d.id, ...d.data(), addedAt: d.data().addedAt && d.data().addedAt.toDate ? d.data().addedAt.toDate().toISOString() : d.data().addedAt })); },
    addAdmin: (email, by, name) => F.setDoc(F.doc(db, "admins", String(email).toLowerCase()), { addedBy: by, name: name || "", addedAt: ts() }),
    removeAdmin: email => F.deleteDoc(F.doc(db, "admins", String(email).toLowerCase())),
  };
  function att(snap){ const d = snap.data() || {}; for (const k of ["checkInAt","checkOutAt","reviewedAt","createdAt","decidedAt"]) if (d[k] && d[k].toDate) d[k] = d[k].toDate().toISOString(); return { id: snap.id, ...d }; }
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
    demo.forEach(d => set("emp-" + d.uid, d)); set("emps", demo.map(d => d.uid)); set("settings", { inviteCode: "JOYBOY" });
    set("hotels", { "demo-hotel": { name: "Demo Beach Resort", city: "Marsa Alam", lat: 25.0676, lng: 34.8934, cosLat: Math.cos(25.0676 * Math.PI / 180), radiusM: 300, shiftStart: "09:45", graceMin: 5, active: true,
      shifts: { s1: { name: "Morning", start: "09:45", end: "12:30", graceMin: 5 }, s2: { name: "Afternoon", start: "14:45", end: "16:30", graceMin: 5 }, s3: { name: "Evening", start: "20:00", end: "23:00", graceMin: 5 } },
      spots: { beach: { name: "Beach", lat: 25.0690, lng: 34.8950, cosLat: Math.cos(25.0690 * Math.PI / 180), radiusM: 150 }, theatre: { name: "Theatre", lat: 25.0670, lng: 34.8925, cosLat: Math.cos(25.0670 * Math.PI / 180), radiusM: 120 } } } });
    set("emp-demo-1", { ...get("emp-demo-1"), hotelId: "demo-hotel" }); set("att", {}); set("seeded", true); };
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
    listHotels: async () => Object.entries(get("hotels") || {}).map(([id, h]) => ({ id, ...h })).sort((a, b) => String(a.name).localeCompare(String(b.name))),
    getHotel: async id => { const h = (get("hotels") || {})[id]; return h ? { id, ...h } : null; },
    saveHotel: async (id, data) => { const hs = get("hotels") || {}; id = id || "h" + Date.now(); hs[id] = { ...(hs[id] || {}), ...data, updatedAt: now() }; set("hotels", hs); return id; },
    deleteHotel: async id => { const hs = get("hotels") || {}; delete hs[id]; set("hotels", hs); },
    getPlan: async (hotelId, date) => { const p = (get("plans") || {})[`${hotelId}_${date}`]; return p ? { id: `${hotelId}_${date}`, ...p } : null; },
    savePlan: async (hotelId, date, shifts, by) => { const ps = get("plans") || {}; ps[`${hotelId}_${date}`] = { hotelId, date, shifts, setBy: by, setAt: now() }; set("plans", ps); },
    checkIn: async rec => { const a = get("att") || {}; const id = `${rec.uid}_${rec.date}_${rec.shift}`; if (a[id] && a[id].checkInAt) throw new Error("Already checked in for this shift"); a[id] = { ...(a[id] || {}), ...rec, checkInAt: now() }; set("att", a); return { id, ...a[id] }; },
    checkOut: async id => { const a = get("att") || {}; if (!a[id]) throw new Error("No check-in for this shift"); a[id].checkOutAt = now(); set("att", a); return { id, ...a[id] }; },
    myAttendance: async (uid, from) => Object.entries(get("att") || {}).map(([id, r]) => ({ id, ...r })).filter(r => r.uid === uid && (!from || r.date >= from)).sort((a, b) => b.date.localeCompare(a.date)),
    attendanceOn: async date => Object.entries(get("att") || {}).map(([id, r]) => ({ id, ...r })).filter(r => r.date === date),
    attendanceRange: async (from, to) => Object.entries(get("att") || {}).map(([id, r]) => ({ id, ...r })).filter(r => r.date >= from && r.date <= to).sort((a, b) => a.date.localeCompare(b.date)),
    setAttendance: async (id, patch) => { const a = get("att") || {}; a[id] = { ...(a[id] || {}), ...patch, reviewedAt: now() }; set("att", a); },
    deleteAttendance: async id => { const a = get("att") || {}; delete a[id]; set("att", a); },
    sendRequest: async rec => { const r = get("req") || {}; const id = `${rec.uid}_${rec.date}_${rec.shift}`; if (r[id]) throw new Error("A request for this shift was already sent"); r[id] = { ...rec, status: "open", createdAt: now() }; set("req", r); return { id, ...r[id] }; },
    myRequests: async (uid, date) => Object.entries(get("req") || {}).map(([id, r]) => ({ id, ...r })).filter(r => r.uid === uid && r.date === date),
    requestsOn: async date => Object.entries(get("req") || {}).map(([id, r]) => ({ id, ...r })).filter(r => r.date === date),
    openRequests: async () => Object.entries(get("req") || {}).map(([id, r]) => ({ id, ...r })).filter(r => r.status === "open").sort((a, b) => b.date.localeCompare(a.date)),
    decideRequest: async (id, patch) => { const r = get("req") || {}; r[id] = { ...(r[id] || {}), ...patch, decidedAt: now() }; set("req", r); },
    isListedAdmin: async email => !!(get("admins") || {})[String(email || "").toLowerCase()],
    listAdmins: async () => Object.entries(get("admins") || {}).map(([email, a]) => ({ email, ...a })),
    addAdmin: async (email, by, name) => { const a = get("admins") || {}; a[String(email).toLowerCase()] = { addedBy: by, name: name || "", addedAt: now() }; set("admins", a); },
    removeAdmin: async email => { const a = get("admins") || {}; delete a[String(email).toLowerCase()]; set("admins", a); },
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

/* ─────────────── attendance helpers (shared by employee page, admin page and the Sheets script) ─────────────── */
export const TZ = "Africa/Cairo";
/** YYYY-MM-DD in Egypt time. */
export function dayKey(d = new Date()){ return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(d)); }
/** HH:MM in Egypt time. */
export function hhmm(d){ if (!d) return ""; return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(d)); }
export function addDays(key, n){ const d = new Date(key + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
export const toMin = t => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(t || "").trim()); return m ? (+m[1]) * 60 + (+m[2]) : null; };
/** Metres between two points (haversine). */
/* Same maths as insideFence() in firestore.rules (equirectangular with the hotel's stored cosLat), so the phone predicts the server's answer. */
export function fenceDistM(lat, lng, hotel){ const cos = typeof hotel.cosLat === "number" ? hotel.cosLat : Math.cos(hotel.lat * Math.PI / 180); const dx = (lng - hotel.lng) * cos * 111320, dy = (lat - hotel.lat) * 110540; return Math.round(Math.sqrt(dx * dx + dy * dy)); }
export function fenceTolM(accuracy){ return accuracy > 0 ? Math.min(100, accuracy) : 0; }
/* Why a check-in would be refused by the rules, before we try — "" when everything looks fine. */
export function fenceProblem(hotel){
  if (!hotel) return "No hotel is assigned to you yet. Ask the office.";
  if (hotel.active === false) return `${hotel.name} is marked closed in the office, so check-in is switched off. Ask the office to reopen it.`;
  if (typeof hotel.lat !== "number" || typeof hotel.lng !== "number" || typeof hotel.cosLat !== "number" || typeof hotel.radiusM !== "number" || !(hotel.radiusM > 0)) return `The location of ${hotel.name} is incomplete in the office. Ask the office to open Hotels, check the pin and radius and save the hotel again.`;
  return "";
}
export function distanceM(lat1, lng1, lat2, lng2){ const R = 6371000, r = Math.PI / 180, dLat = (lat2 - lat1) * r, dLng = (lng2 - lng1) * r; const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLng / 2) ** 2; return Math.round(2 * R * Math.asin(Math.sqrt(a))); }
/** Accepts "25.0676, 34.8934", a Google Maps link (…@25.06,34.89,17z or ?q=25.06,34.89 or !3d25.06!4d34.89) → {lat,lng} or null. */
export function parseLatLng(text){
  const t = String(text || "").trim(); if (!t) return null;
  const pats = [/@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/, /[?&](?:q|query|ll|center|destination)=(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/, /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/, /^(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)$/];
  for (const re of pats){ const m = re.exec(t); if (m){ const lat = +m[1], lng = +m[2]; if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng }; } }
  // degrees / minutes / seconds, as Google Maps copies them: 24°55'14.3"N 34°57'51.6"E
  const dms = /(\d{1,3})°\s*(\d{1,2})['′]\s*([\d.]+)?["″]?\s*([NS])[\s,]+(\d{1,3})°\s*(\d{1,2})['′]\s*([\d.]+)?["″]?\s*([EW])/i.exec(t);
  if (dms){ const f = (d, m, sec, h) => (+d + (+m) / 60 + (+(sec || 0)) / 3600) * (/[SW]/i.test(h) ? -1 : 1); const lat = f(dms[1], dms[2], dms[3], dms[4]), lng = f(dms[5], dms[6], dms[7], dms[8]); if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat: +lat.toFixed(6), lng: +lng.toFixed(6) }; }
  return null;
}
export const ATT_LABEL = { present: "Present", "half-day": "Half day", absent: "Absent", sick: "Sick", vacation: "Vacation", excused: "Excused", off: "Day off", pending: "Not yet", late: "Late" };

/* ─────────────── shifts, spots and the daily plan ─────────────── */
/** The agency's standard day: three shifts with breaks between them. A hotel can change names/times in the editor. */
export const DEFAULT_SHIFTS = { s1: { name: "Morning", start: "09:45", end: "12:30", graceMin: 5 }, s2: { name: "Afternoon", start: "14:45", end: "16:30", graceMin: 5 }, s3: { name: "Evening", start: "20:00", end: "23:00", graceMin: 5 } };
export const SHIFT_KEYS = ["s1", "s2", "s3", "s4"];
/** Ordered shifts of a hotel: [{key,name,start,end,graceMin}] — falls back to the standard three. */
export function hotelShifts(hotel){
  const src = hotel && hotel.shifts && Object.keys(hotel.shifts).length ? hotel.shifts : DEFAULT_SHIFTS, g = hotel && hotel.graceMin != null ? +hotel.graceMin : 5;
  return SHIFT_KEYS.filter(k => src[k] && src[k].start).map(k => ({ key: k, name: src[k].name || k.toUpperCase(), start: src[k].start, end: src[k].end || "", graceMin: src[k].graceMin != null ? +src[k].graceMin : g }));
}
/** Named places inside the resort where a shift can check in: [{key,name,lat,lng,cosLat,radiusM}]. */
export function hotelSpots(hotel){ const s = (hotel && hotel.spots) || {}; return Object.keys(s).sort((a, b) => String(s[a].name).localeCompare(String(s[b].name))).map(k => ({ key: k, ...s[k] })); }
export const slug = s => String(s || "").toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30);
/** Where a shift checks in on a given day: the planned spot, or null = anywhere inside the hotel radius. */
export function plannedSpot(hotel, plan, shiftKey){ const k = plan && plan.shifts && plan.shifts[shiftKey] && plan.shifts[shiftKey].spot; const sp = k && hotel && hotel.spots && hotel.spots[k]; return sp ? { key: k, ...sp } : null; }
/** Minutes before a shift starts that the check-in button opens, and after it ends that check-in/out is still possible. */
export const SHIFT_OPEN_MIN = 90, SHIFT_CLOSE_MIN = 30;
export const shiftEndMin = s => toMin(s.end) ?? (toMin(s.start) + 180);
/** The shift the buttons are for right now: the one whose window is open, else the next one today, else the last. */
export function currentShift(shifts, nowMin){
  if (!shifts || !shifts.length) return null;
  return shifts.find(s => nowMin >= toMin(s.start) - SHIFT_OPEN_MIN && nowMin <= shiftEndMin(s) + SHIFT_CLOSE_MIN) || shifts.find(s => nowMin < toMin(s.start)) || shifts[shifts.length - 1];
}
/** Status of one shift: present / late (needs decision) / absent / pending (not started yet). An office override wins. */
export function shiftStatus(rec, shift, date, today = dayKey(), nowMin = toMin(hhmm(new Date()))){
  const start = toMin(shift.start) ?? 0, grace = shift.graceMin != null ? +shift.graceMin : 5;
  if (rec && rec.override) return { code: rec.override, lateMin: rec.checkInAt ? Math.max(0, toMin(hhmm(rec.checkInAt)) - start) : null, auto: false };
  if (rec && rec.checkInAt){ const late = toMin(hhmm(rec.checkInAt)) - start; return late <= grace ? { code: "present", lateMin: Math.max(0, late), auto: true } : { code: "late", lateMin: late, auto: true, review: true }; }
  if (date > today || (date === today && nowMin <= start + grace)) return { code: "pending", lateMin: null, auto: true };
  return { code: "absent", lateMin: null, auto: true };
}
/**
 * Status of a whole day from its shift records: every shift attended → Present, some → Half day, none → Absent,
 * "pending" while shifts are still to come. A day mark by the office (sick, vacation, off, …) wins; a record from
 * before shifts existed (day check-in) is judged by the old rule.
 */
export function dayStatus(dayRec, shiftRecs, shifts, hotel, date, today = dayKey()){
  if (dayRec && dayRec.override) return { code: dayRec.override, auto: false, review: false, lateMin: null, done: 0, total: shifts.length, shifts: [] };
  if ((!shiftRecs || !shiftRecs.length) && dayRec && dayRec.checkInAt) return { ...attStatus(dayRec, hotel, today), done: 1, total: 1, shifts: [] };
  const sts = shifts.map(s => ({ shift: s, rec: (shiftRecs || []).find(r => r.shift === s.key) || null, st: shiftStatus((shiftRecs || []).find(r => r.shift === s.key) || null, s, date, today) }));
  const done = sts.filter(x => ["present", "late", "excused"].includes(x.st.code)).length, pend = sts.filter(x => x.st.code === "pending").length, review = sts.some(x => x.st.review);
  const code = !shifts.length ? "pending" : pend > 0 ? "pending" : done === shifts.length ? "present" : done > 0 ? "half-day" : "absent";
  return { code, auto: true, review, lateMin: null, done, total: shifts.length, shifts: sts };
}
/** Badge text for a day: "2/3 so far" while the day is running. */
export const dayLabel = st => st.review ? "Late · needs decision" : st.code === "pending" && st.done ? `${st.done}/${st.total} so far` : ATT_LABEL[st.code] || st.code;
/** Badge text for a status: a late check-in that nobody has decided on yet reads "Late · needs decision". */
export const attLabel = st => st.review ? "Late · needs decision" : ATT_LABEL[st.code];
export const ATT_OVERRIDES = ["present", "half-day", "absent", "sick", "vacation", "excused", "off"];
/** Decisions the office can take on one shift. */
export const SHIFT_DECISIONS = ["present", "excused", "absent"];
/**
 * Status of one day. Automatic rule: checked in by shift start + grace → present; later → half day; no check-in → absent
 * (or "pending" while the shift has not started yet today). An admin override wins.
 */
export function attStatus(rec, hotel, today = dayKey()){
  const start = toMin(hotel && hotel.shiftStart) ?? 9 * 60, grace = hotel && hotel.graceMin != null ? +hotel.graceMin : 10;
  if (rec && rec.override) return { code: rec.override, lateMin: rec.checkInAt ? Math.max(0, toMin(hhmm(rec.checkInAt)) - start) : null, auto: false };
  if (rec && rec.checkInAt){ const late = toMin(hhmm(rec.checkInAt)) - start; return late <= grace ? { code: "present", lateMin: Math.max(0, late), auto: true } : { code: "half-day", lateMin: late, auto: true, review: true }; }
  const date = rec ? rec.date : today;
  if (date > today) return { code: "pending", lateMin: null, auto: true };
  if (date === today && toMin(hhmm(new Date())) <= start + grace) return { code: "pending", lateMin: null, auto: true };
  return { code: "absent", lateMin: null, auto: true };
}
