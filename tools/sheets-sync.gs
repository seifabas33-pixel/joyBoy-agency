/**
 * Joy Boy Agency — pull attendance from the team portal (Firestore) into this Google Sheet.
 *
 * Setup (once, ~3 minutes):
 *  1. Open your attendance Google Sheet → Extensions → Apps Script.
 *  2. Replace the contents of Code.gs with this file. Save.
 *  3. Project Settings (gear) → tick "Show appsscript.json manifest file in editor".
 *     Open appsscript.json and replace it with:
 *        {
 *          "timeZone": "Africa/Cairo",
 *          "exceptionLogging": "STACKDRIVER",
 *          "runtimeVersion": "V8",
 *          "oauthScopes": [
 *            "https://www.googleapis.com/auth/spreadsheets.currentonly",
 *            "https://www.googleapis.com/auth/script.external_request",
 *            "https://www.googleapis.com/auth/script.scriptapp",
 *            "https://www.googleapis.com/auth/script.send_mail",
 *            "https://www.googleapis.com/auth/datastore"
 *          ]
 *        }
 *  4. Back in Code.gs, choose the function `syncAttendance` in the toolbar and press Run.
 *     Google asks you to authorise once — sign in with the Google account that owns the
 *     Firebase project (the admin account). If it warns "unverified app", choose Advanced → Go to … (unsafe);
 *     it is your own script.
 *  5. Reload the Sheet: a "Joy Boy" menu appears. Use "Sync attendance now" any time, or run
 *     `installHourlyTrigger` once so the sheet refreshes itself every hour.
 *
 * Import (sheet → portal): open one of your monthly grid tabs (names in column B, one
 * column per day with a letter) and use Joy Boy → "Import this month tab into the portal".
 * Letters: P present · H half day · A absent · S sick · V vacation · O day off · E excused.
 * Names are matched to the portal's stage name / full name; for anyone it cannot match,
 * add a tab "Portal names" with the sheet name in column A and the person's Gmail in column B.
 *
 * Digest e-mails: Joy Boy → "Install twice-daily digest" sends the office accounts a short e-mail at
 * about 10:30 and 20:30 Egypt time with pending registrations, late check-ins and requests that need a
 * decision, and who has not checked in yet. "Send digest now" sends one immediately.
 *
 * What the sync writes: a tab "Attendance (portal)" with one row per person and day
 * (date, name, email, hotel, check-in, check-out, status, late minutes, distance, override, by),
 * and a tab "Hotels (portal)". Other tabs in your sheet are never touched.
 * Status rule = the same one the portal uses: checked in by shift start + grace → Present,
 * later → Half day, no check-in → Absent; an admin override wins.
 */
const PROJECT_ID = "joy-boy-agency";
const DAYS_BACK = 62;                 // how much history to (re)write each run
const TZ = "Africa/Cairo";
const ATT_TAB = "Attendance (portal)", HOTEL_TAB = "Hotels (portal)";

function onOpen(){ SpreadsheetApp.getUi().createMenu("Joy Boy").addItem("Sync attendance now", "syncAttendance").addItem("Import this month tab into the portal", "importGrid").addSeparator().addItem("Send digest now", "sendDigest").addItem("Install twice-daily digest", "installDigestTriggers").addSeparator().addItem("Refresh every hour (install)", "installHourlyTrigger").addToUi(); }
function installHourlyTrigger(){ ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === "syncAttendance").forEach(t => ScriptApp.deleteTrigger(t)); ScriptApp.newTrigger("syncAttendance").timeBased().everyHours(1).create(); try { SpreadsheetApp.getUi().alert("Done — the sheet now refreshes every hour."); } catch (e) {} }

function syncAttendance(){
  const hotels = fetchAll("hotels").map(d => ({ id: d.id, ...d.f }));
  const employees = fetchAll("employees").map(d => ({ uid: d.id, ...d.f }));
  const from = Utilities.formatDate(new Date(Date.now() - DAYS_BACK * 864e5), TZ, "yyyy-MM-dd"), today = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd");
  const recs = fetchAll("attendance").map(d => ({ id: d.id, ...d.f })).filter(r => r.date >= from);
  const byHotel = Object.fromEntries(hotels.map(h => [h.id, h]));
  const firstDay = {}; recs.forEach(r => { if (!firstDay[r.uid] || r.date < firstDay[r.uid]) firstDay[r.uid] = r.date; });
  employees.forEach(e => { const reg = String(e.createdAt || "").slice(0, 10); if (reg && (!firstDay[e.uid] || reg < firstDay[e.uid])) firstDay[e.uid] = reg; });
  const rows = [];
  for (let d = from; d <= today; d = addDays(d, 1)){
    const dayRecs = recs.filter(r => r.date === d);
    const people = employees.filter(e => e.status === "approved" && e.hotelId && (!firstDay[e.uid] || d >= firstDay[e.uid])).map(e => ({ e, r: dayRecs.find(r => r.uid === e.uid) || null, hotelId: e.hotelId }));
    dayRecs.forEach(r => { if (!people.some(x => x.e.uid === r.uid)) people.push({ e: { fullName: r.name, email: r.email }, r, hotelId: r.hotelId }); });
    people.forEach(x => { const h = byHotel[x.hotelId] || {}; const st = status(x.r, h, d, today);
      rows.push([d, x.e.fullName || "", x.e.email || "", h.name || x.hotelId || "", x.r && x.r.checkInAt ? hhmm(x.r.checkInAt) : "", x.r && x.r.checkOutAt ? hhmm(x.r.checkOutAt) : "", st.label, st.lateMin == null ? "" : st.lateMin, x.r && x.r.distM != null ? x.r.distM : "", x.r && x.r.override ? x.r.override : "", x.r && x.r.overrideBy ? x.r.overrideBy : "", st.review ? "yes" : ""]); });
  }
  rows.sort((a, b) => (a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : String(a[3]).localeCompare(b[3]) || String(a[1]).localeCompare(b[1])));
  writeTab(ATT_TAB, ["Date","Name","Email","Hotel","Check-in","Check-out","Status","Late (min)","Distance (m)","Override","Override by","Needs decision"], rows);
  writeTab(HOTEL_TAB, ["Hotel","Town","Shift start","Grace (min)","Radius (m)","Active","Staff assigned"], hotels.map(h => [h.name, h.city || "", h.shiftStart, h.graceMin, h.radiusM, h.active === false ? "no" : "yes", employees.filter(e => e.hotelId === h.id && e.status === "approved").length]));
  SpreadsheetApp.getActive().toast("Attendance synced: " + rows.length + " rows", "Joy Boy", 5);
}

/* ── status rule (mirror of team/portal.js attStatus) ── */
const LABEL = { present: "Present", "half-day": "Half day", absent: "Absent", sick: "Sick", vacation: "Vacation", excused: "Excused", off: "Day off", pending: "Not yet" };
function status(r, h, date, today){
  const start = toMin(h.shiftStart) == null ? 540 : toMin(h.shiftStart), grace = h.graceMin == null ? 10 : +h.graceMin;
  if (r && r.override) return { label: LABEL[r.override] || r.override, lateMin: r.checkInAt ? Math.max(0, toMin(hhmm(r.checkInAt)) - start) : null };
  if (r && r.checkInAt){ const late = toMin(hhmm(r.checkInAt)) - start; return late <= grace ? { label: LABEL.present, lateMin: Math.max(0, late) } : { label: LABEL["half-day"], lateMin: late, review: true }; }
  if (date === today && toMin(hhmm(new Date())) <= start + grace) return { label: LABEL.pending, lateMin: null };
  return { label: LABEL.absent, lateMin: null };
}
const toMin = t => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(t || "")); return m ? +m[1] * 60 + +m[2] : null; };
const hhmm = d => Utilities.formatDate(new Date(d), TZ, "HH:mm");
const addDays = (k, n) => Utilities.formatDate(new Date(new Date(k + "T12:00:00Z").getTime() + n * 864e5), "UTC", "yyyy-MM-dd");

/* ── Firestore REST (reads as the signed-in Google account, which owns the project) ── */
function fetchAll(collection){
  const base = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}?pageSize=300`;
  const out = []; let token = "";
  do {
    const res = UrlFetchApp.fetch(base + (token ? "&pageToken=" + encodeURIComponent(token) : ""), { headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) throw new Error("Firestore " + collection + ": " + res.getContentText().slice(0, 300));
    const j = JSON.parse(res.getContentText());
    (j.documents || []).forEach(doc => out.push({ id: doc.name.split("/").pop(), f: unwrap(doc.fields || {}) }));
    token = j.nextPageToken || "";
  } while (token);
  return out;
}
function unwrap(fields){ const o = {}; for (const k in fields) o[k] = val(fields[k]); return o; }
function val(v){ if ("stringValue" in v) return v.stringValue; if ("integerValue" in v) return +v.integerValue; if ("doubleValue" in v) return v.doubleValue; if ("booleanValue" in v) return v.booleanValue; if ("timestampValue" in v) return v.timestampValue; if ("nullValue" in v) return null; if ("arrayValue" in v) return (v.arrayValue.values || []).map(val); if ("mapValue" in v) return unwrap(v.mapValue.fields || {}); return null; }

function writeTab(name, header, rows){
  const ss = SpreadsheetApp.getActive(); let sh = ss.getSheetByName(name); if (!sh) sh = ss.insertSheet(name);
  sh.clearContents(); sh.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight("bold");
  if (rows.length) sh.getRange(2, 1, rows.length, header.length).setValues(rows);
  sh.setFrozenRows(1); sh.autoResizeColumns(1, header.length);
}

/* ────────────────────────── Import: monthly grid tab → portal ────────────────────────── */
const LETTER = { P: "present", H: "half-day", A: "absent", S: "sick", V: "vacation", O: "off", E: "excused" };
const norm = t => String(t || "").toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z0-9\u0600-\u06ff ]+/g, " ").replace(/\s+/g, " ").trim();

function importGrid(){
  const ui = SpreadsheetApp.getUi(), ss = SpreadsheetApp.getActive(), sh = ss.getActiveSheet();
  if ([ATT_TAB, HOTEL_TAB, "Portal names", "Import log"].includes(sh.getName())) return ui.alert("Open one of your monthly grid tabs first (for example \"September. 26\"), then run the import.");
  const values = sh.getDataRange().getValues();
  // header row = the row with the most day cells (Date objects or "9/1" texts) in the first 15 rows
  let hdr = -1, best = 0; for (let r = 0; r < Math.min(15, values.length); r++){ const n = values[r].filter(isDayCell).length; if (n > best){ best = n; hdr = r; } }
  if (hdr < 0 || best < 5) return ui.alert("Could not find the row with the dates (9/1, 9/2, …) in the first 15 rows.");
  const yearGuess = (() => { for (let r = 0; r < Math.min(6, values.length); r++) for (const c of values[r]) { const m = /(20\d{2})/.exec(String(c)); if (m) return +m[1]; } return new Date().getFullYear(); })();
  const dayCols = []; values[hdr].forEach((c, i) => { const d = dayKeyOf(c, yearGuess); if (d) dayCols.push({ col: i, date: d }); });
  const today = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd");
  // people from the portal + optional mapping tab
  const employees = fetchAll("employees").map(d => ({ uid: d.id, ...d.f }));
  const hotels = Object.fromEntries(fetchAll("hotels").map(d => [d.id, d.f]));
  const map = {}; const mt = ss.getSheetByName("Portal names"); if (mt) mt.getDataRange().getValues().forEach(r => { if (r[0] && r[1]) map[norm(r[0])] = String(r[1]).toLowerCase().trim(); });
  const findEmp = name => { const n = norm(name); if (!n) return null;
    if (map[n]) return employees.find(e => String(e.email).toLowerCase() === map[n]) || null;
    return employees.find(e => norm(e.preferredName) === n) || employees.find(e => norm(e.fullName) === n) || employees.find(e => norm(e.fullName).split(" ")[0] === n.split(" ")[0] && n.split(" ").length === 1) || null; };
  const existing = {}; fetchAll("attendance").forEach(d => existing[d.id] = d.f);
  const me = "Google Sheet import";
  const writes = [], log = [], unmatched = new Set(), unknown = new Set();
  for (let r = hdr + 1; r < values.length; r++){
    const name = values[r][1] || values[r][0]; if (!String(name).trim()) continue;
    const emp = findEmp(name); if (!emp){ unmatched.add(String(name).trim()); continue; }
    for (const { col, date } of dayCols){
      const raw = String(values[r][col] || "").trim().toUpperCase(); if (!raw || date > today) continue;
      const code = LETTER[raw]; if (!code){ unknown.add(raw); continue; }
      const id = emp.uid + "_" + date, cur = existing[id];
      if (code === "present" && cur && cur.checkInAt && !cur.override) continue;      // real check-in already there: keep the automatic status
      if (cur && cur.override === code && cur.source === "sheet") continue;           // already imported, unchanged
      const hotelId = (cur && cur.hotelId) || emp.hotelId || "";
      writes.push({ id, fields: { uid: emp.uid, email: emp.email || "", name: emp.fullName || String(name), hotelId, hotelName: (hotels[hotelId] || {}).name || sh.getName(), date, override: code, overrideBy: me, source: "sheet" } });
      log.push([date, String(name).trim(), emp.email || "", LABEL[code]]);
    }
  }
  patchAll(writes);
  const lg = ss.getSheetByName("Import log") || ss.insertSheet("Import log"); lg.clearContents();
  lg.getRange(1, 1, 1, 4).setValues([["Date", "Sheet name", "Portal account", "Imported as"]]).setFontWeight("bold");
  if (log.length) lg.getRange(2, 1, log.length, 4).setValues(log);
  let msg = `Imported ${writes.length} day(s) from "${sh.getName()}" into the portal.`;
  if (unmatched.size) msg += `\n\nNot found in the portal (add them to a tab "Portal names": column A = this name, column B = their Gmail): ${[...unmatched].join(", ")}`;
  if (unknown.size) msg += `\n\nLetters I did not understand (use P/H/A/S/V/O/E): ${[...unknown].join(", ")}`;
  ui.alert(msg);
  syncAttendance();
}
function isDayCell(c){ return c instanceof Date || /^\s*\d{1,2}\/\d{1,2}(\/\d{2,4})?\s*$/.test(String(c)); }
function dayKeyOf(c, year){
  if (c instanceof Date) return Utilities.formatDate(c, TZ, "yyyy-MM-dd");
  const m = /^\s*(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s*$/.exec(String(c)); if (!m) return null;
  const y = m[3] ? (+m[3] < 100 ? 2000 + +m[3] : +m[3]) : year;
  return y + "-" + ("0" + m[1]).slice(-2) + "-" + ("0" + m[2]).slice(-2);          // sheet uses M/D
}
function patchAll(writes){
  const enc = v => typeof v === "number" ? (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }) : typeof v === "boolean" ? { booleanValue: v } : { stringValue: String(v) };
  for (let i = 0; i < writes.length; i += 40){
    const reqs = writes.slice(i, i + 40).map(w => { const mask = Object.keys(w.fields).map(k => "updateMask.fieldPaths=" + k).join("&");
      return { url: `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/attendance/${w.id}?${mask}`, method: "patch", contentType: "application/json", headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() }, payload: JSON.stringify({ fields: Object.fromEntries(Object.entries(w.fields).map(([k, v]) => [k, enc(v)])) }), muteHttpExceptions: true }; });
    UrlFetchApp.fetchAll(reqs).forEach((res, j) => { if (res.getResponseCode() >= 300) throw new Error("Write failed for " + writes[i + j].id + ": " + res.getContentText().slice(0, 200)); });
  }
}

/* ────────────────────────── Digest e-mail for the office ────────────────────────── */
const BUILT_IN_ADMINS = ["seifabas33@gmail.com", "seif.abas33@gmail.com", "joyboyentertainmentagency@gmail.com", "the.z.1417@gmail.com"];
const ADMIN_URL = "https://seifabas33-pixel.github.io/joyBoy-agency/team/admin.html";

function installDigestTriggers(){
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === "sendDigest").forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("sendDigest").timeBased().atHour(10).nearMinute(30).everyDays(1).inTimezone(TZ).create();
  ScriptApp.newTrigger("sendDigest").timeBased().atHour(20).nearMinute(30).everyDays(1).inTimezone(TZ).create();
  try { SpreadsheetApp.getUi().alert("Done — the office gets a digest at about 10:30 and 20:30 Egypt time."); } catch (e) {}
}

function sendDigest(){
  const today = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd"), nowMin = toMin(hhmm(new Date()));
  const employees = fetchAll("employees").map(d => ({ uid: d.id, ...d.f }));
  const hotels = Object.fromEntries(fetchAll("hotels").map(d => [d.id, d.f]));
  const att = fetchAll("attendance").map(d => ({ id: d.id, ...d.f })).filter(r => r.date === today);
  const reqs = fetchAll("requests").map(d => ({ id: d.id, ...d.f })).filter(r => r.status === "open");
  const admins = fetchAll("admins").map(d => d.id);
  const to = [...new Set(BUILT_IN_ADMINS.concat(admins))].join(",");
  const name = e => e.preferredName || e.fullName || e.email;
  const pending = employees.filter(e => (e.status || "pending") === "pending");
  const active = employees.filter(e => e.status === "approved" && e.hotelId);
  const late = [], absent = [], present = [];
  active.forEach(e => { const h = hotels[e.hotelId] || {}, r = att.find(a => a.uid === e.uid); const st = status(r, h, today, today);
    if (r && r.checkInAt && st.label === LABEL["half-day"] && !r.override) late.push(`${name(e)} — ${h.name || ""}, in at ${hhmm(r.checkInAt)} (${st.lateMin} min late)`);
    else if (r && r.checkInAt) present.push(name(e));
    else if (!r || !r.override){ const start = toMin(h.shiftStart) == null ? 540 : toMin(h.shiftStart), grace = h.graceMin == null ? 10 : +h.graceMin; if (nowMin > start + grace) absent.push(`${name(e)} — ${h.name || ""}`); } });
  const lines = [];
  lines.push(`Joy Boy office digest — ${today} ${hhmm(new Date())} (Egypt time)`, "");
  lines.push(`Present today: ${present.length} of ${active.length} assigned staff.`, "");
  if (pending.length) lines.push(`PENDING REGISTRATIONS (${pending.length}):`, ...pending.map(e => `  • ${name(e)} — ${e.email}`), "");
  if (late.length) lines.push(`LATE CHECK-INS — NEED A DECISION (${late.length}):`, ...late.map(x => "  • " + x), "");
  if (reqs.length) lines.push(`REQUESTS FROM STAFF (${reqs.length}):`, ...reqs.map(r => `  • ${r.name || r.email} — ${r.date}: "${r.reason}"`), "");
  if (absent.length) lines.push(`NOT CHECKED IN YET (${absent.length}):`, ...absent.map(x => "  • " + x), "");
  if (!pending.length && !late.length && !reqs.length && !absent.length) lines.push("Nothing needs a decision right now.", "");
  lines.push(`Decide here: ${ADMIN_URL}#att`, "", "This e-mail is generated by the attendance sheet script. Personal data — do not forward outside the office.");
  const todo = pending.length + late.length + reqs.length;
  MailApp.sendEmail({ to, subject: `Joy Boy · ${today} · ${todo ? todo + " to decide" : "all clear"} · ${present.length}/${active.length} present`, body: lines.join("\n"), name: "Joy Boy office" });
  try { SpreadsheetApp.getActive().toast("Digest sent to " + to.split(",").length + " office accounts", "Joy Boy", 5); } catch (e) {}
}
