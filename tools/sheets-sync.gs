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
 *            "https://www.googleapis.com/auth/datastore",
 *            "https://www.googleapis.com/auth/firebase.messaging"
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
const ATT_TAB = "Attendance (portal)", HOTEL_TAB = "Hotels (portal)", REPORT_TAB = "Sync report (portal)";
const SCRIPT_VERSION = "2026-09-11d";   // shown in every toast, so you can tell which copy the sheet is running

function onOpen(){ SpreadsheetApp.getUi().createMenu("Joy Boy").addItem("Sync attendance now", "syncAttendance").addItem("Import this month tab into the portal", "importGrid").addSeparator().addItem("Send digest now", "sendDigest").addItem("Install twice-daily digest", "installDigestTriggers").addSeparator().addItem("Refresh every hour (install)", "installHourlyTrigger").addSeparator().addItem("Reminders: install (every 15 min)", "installPushTriggers").addItem("Reminders: send a test", "testPush").addToUi(); }
function installHourlyTrigger(){ ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === "syncAttendance").forEach(t => ScriptApp.deleteTrigger(t)); ScriptApp.newTrigger("syncAttendance").timeBased().everyHours(1).create(); note("Done — the sheet now refreshes every hour."); }
/** Non-blocking confirmation: a toast in the sheet if it is open, otherwise just the log (an alert would wait for a click and time out). */
function note(msg){ Logger.log(msg); try { SpreadsheetApp.getActive().toast(msg, "Joy Boy", 8); } catch (e) {} }

function syncAttendance(){
  const hotels = fetchAll("hotels").map(d => ({ id: d.id, ...d.f }));
  const employees = fetchAll("employees").map(d => ({ uid: d.id, ...d.f }));
  const from = Utilities.formatDate(new Date(Date.now() - DAYS_BACK * 864e5), TZ, "yyyy-MM-dd"), today = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd");
  const recs = fetchAll("attendance").map(d => ({ id: d.id, ...d.f })).filter(r => r.date >= from);
  const plans = fetchAll("plans").map(d => ({ id: d.id, ...d.f })).filter(p => p.date >= from), planOf = (hid, d) => plans.find(p => p.hotelId === hid && p.date === d);
  const byHotel = Object.fromEntries(hotels.map(h => [h.id, h]));
  const firstDay = {}; recs.forEach(r => { if (!firstDay[r.uid] || r.date < firstDay[r.uid]) firstDay[r.uid] = r.date; });
  employees.forEach(e => { const reg = String(e.createdAt || "").slice(0, 10); if (/^\d{4}-\d{2}-\d{2}$/.test(reg) && (!firstDay[e.uid] || reg < firstDay[e.uid])) firstDay[e.uid] = reg; });
  const rows = []; let skipped = 0, days = 0;
  for (let d = from; d <= today; d = addDays(d, 1)){
    days++;
    const dayRecs = recs.filter(r => r.date === d);
    const people = employees.filter(e => e.status === "approved" && e.hotelId && (!firstDay[e.uid] || d >= firstDay[e.uid])).map(e => ({ e, r: dayRecs.find(r => r.uid === e.uid) || null, hotelId: e.hotelId }));
    dayRecs.forEach(r => { if (!people.some(x => x.e.uid === r.uid)) people.push({ e: { uid: r.uid, fullName: r.name, email: r.email }, r, hotelId: r.hotelId }); });
    people.forEach(x => {
      const uid = x.e.uid || (x.r && x.r.uid), h = byHotel[x.hotelId] || {};
      try {
        const shifts = scheduledShifts(hotelShifts(h), planOf(x.hotelId, d), uid), dayRec = dayRecs.find(r => r.uid === uid && !r.shift) || null, srecs = dayRecs.filter(r => r.uid === uid && r.shift);
        const ds = dayStatus(dayRec, srecs, shifts, h, d, today), cells = [];
        for (let i = 0; i < 4; i++){ const y = ds.shifts[i]; cells.push(y ? y.sh.name : "", y && y.r && y.r.checkInAt ? hhmm(y.r.checkInAt) : "", y && y.r && y.r.checkOutAt ? hhmm(y.r.checkOutAt) : "", y ? y.st.label : "", y && y.st.lateMin != null ? y.st.lateMin : "", y && y.r && y.r.spotName ? y.r.spotName : ""); }
        const lg = ds.legacy;
        rows.push([d, x.e.fullName || "", x.e.email || "", h.name || x.hotelId || ""].concat(cells, [ds.label, lg && lg.checkInAt ? hhmm(lg.checkInAt) : "", lg && lg.checkOutAt ? hhmm(lg.checkOutAt) : "", dayRec && dayRec.override ? dayRec.override : "", dayRec && dayRec.overrideBy ? dayRec.overrideBy : "", ds.review ? "yes" : ""]));
      } catch (err) { skipped++; Logger.log("row failed " + d + " " + uid + ": " + err); rows.push([d, x.e.fullName || "", x.e.email || "", h.name || x.hotelId || ""].concat(new Array(24).fill(""), ["error: " + err, "", "", "", "", ""])); }
    });
  }
  rows.sort((a, b) => (a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : String(a[3]).localeCompare(b[3]) || String(a[1]).localeCompare(b[1])));
  const hdr = ["Date","Name","Email","Hotel"]; for (let i = 1; i <= 4; i++) hdr.push("Shift " + i, "S" + i + " in", "S" + i + " out", "S" + i + " status", "S" + i + " late (min)", "S" + i + " spot");
  writeTab(ATT_TAB, hdr.concat(["Day status","Old check-in","Old check-out","Day mark","Mark by","Needs decision"]), rows);
  writeTab(HOTEL_TAB, ["Hotel","Town","Shifts","Spots","Radius (m)","Active","Staff assigned"], hotels.map(h => [h.name, h.city || "", hotelShifts(h).map(x => x.name + " " + x.start + "–" + x.end).join(" · "), Object.keys(h.spots || {}).map(k => h.spots[k].name).join(", "), h.radiusM, h.active === false ? "no" : "yes", employees.filter(e => e.hotelId === h.id && e.status === "approved").length]));
  writeSyncReport(employees, byHotel, recs, from, today);
  note("v" + SCRIPT_VERSION + " · Attendance synced: " + rows.length + " rows over " + days + " days · " + employees.filter(e => e.status === "approved" && e.hotelId).length + " assigned staff · " + recs.length + " records" + (skipped ? " · " + skipped + " rows failed (see the log)" : ""));
}

/* ── status rule (mirror of team/portal.js attStatus) ── */
const LABEL = { present: "Present", "half-day": "Half day", absent: "Absent", sick: "Sick", vacation: "Vacation", excused: "Excused", off: "Day off", pending: "Not yet" };
/* ── shifts (2026-09-08): mirrors hotelShifts / shiftStatus / dayStatus in team/portal.js ── */
const DEFAULT_SHIFTS = { s1: { name: "Morning", start: "09:45", end: "12:30", graceMin: 5 }, s2: { name: "Afternoon", start: "14:45", end: "16:30", graceMin: 5 }, s3: { name: "Evening", start: "20:00", end: "23:00", graceMin: 5 } };
function hotelShifts(h){
  const src = h && h.shifts && Object.keys(h.shifts).length ? h.shifts : DEFAULT_SHIFTS, g = h && h.graceMin != null ? +h.graceMin : 5;
  return ["s1","s2","s3","s4"].filter(k => src[k] && src[k].start).map(k => ({ key: k, name: src[k].name || k, start: src[k].start, end: src[k].end || "", graceMin: src[k].graceMin != null ? +src[k].graceMin : g }));
}
function shiftStatus(r, sh, date, today, nowMin){
  const start = toMin(sh.start) == null ? 0 : toMin(sh.start), grace = sh.graceMin == null ? 5 : +sh.graceMin;
  if (r && r.override) return { code: r.override, label: LABEL[r.override] || r.override, lateMin: r.checkInAt ? Math.max(0, toMin(hhmm(r.checkInAt)) - start) : null };
  if (r && r.checkInAt){ const late = toMin(hhmm(r.checkInAt)) - start; return late <= grace ? { code: "present", label: LABEL.present, lateMin: Math.max(0, late) } : { code: "late", label: "Late (undecided)", lateMin: late, review: true }; }
  if (date > today || (date === today && nowMin <= start + grace)) return { code: "pending", label: LABEL.pending, lateMin: null };
  return { code: "absent", label: LABEL.absent, lateMin: null };
}
function scheduledShifts(shifts, plan, uid){ const e = plan && plan.roster && plan.roster[uid]; if (!e) return shifts; if (e.off) return []; const keys = Array.isArray(e.shifts) ? e.shifts : []; return shifts.filter(s => keys.indexOf(s.key) >= 0); }
function dayStatus(dayRec, srecs, shifts, h, date, today){
  const nowMin = toMin(hhmm(new Date()));
  const sts = shifts.map(sh => { const r = srecs.find(x => x.shift === sh.key) || null; return { sh, r, st: shiftStatus(r, sh, date, today, nowMin) }; });
  const done = sts.filter(x => ["present","late","excused"].indexOf(x.st.code) >= 0).length, pend = sts.filter(x => x.st.code === "pending").length, review = sts.some(x => x.st.review);
  if (dayRec && dayRec.override) return { code: dayRec.override, label: LABEL[dayRec.override] || dayRec.override, shifts: sts, review: false };
  if (!srecs.length && dayRec && dayRec.checkInAt){ const st = status(dayRec, h, date, today); return { code: st.label === LABEL.present ? "present" : st.label === LABEL["half-day"] ? "half-day" : "absent", label: st.label, shifts: [], review: !!st.review, legacy: dayRec }; }
  if (!shifts.length) return { code: "off", label: LABEL.off, shifts: [], review: false };
  const code = pend > 0 ? "pending" : done === shifts.length ? "present" : done > 0 ? "half-day" : "absent";
  return { code, label: review ? "Late (undecided)" : code === "pending" && done ? done + "/" + shifts.length + " so far" : LABEL[code], shifts: sts, review };
}
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

/**
 * Why is someone missing from the sheet? Run this and read the toast / the execution log.
 * It only counts and names reasons — no attendance figures leave the sheet.
 */
function diagnose(){
  const today = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd"), from = Utilities.formatDate(new Date(Date.now() - DAYS_BACK * 864e5), TZ, "yyyy-MM-dd");
  const employees = fetchAll("employees").map(d => ({ uid: d.id, ...d.f }));
  const hotels = fetchAll("hotels").map(d => ({ id: d.id, ...d.f })), byHotel = {}; hotels.forEach(h => { byHotel[h.id] = h; });
  const all = fetchAll("attendance").map(d => ({ id: d.id, ...d.f })), recs = all.filter(r => r.date >= from);
  const dates = {}; recs.forEach(r => { dates[r.date] = (dates[r.date] || 0) + 1; });
  const why = [];
  employees.forEach(e => {
    const reg = String(e.createdAt || "").slice(0, 10), regOk = /^\d{4}-\d{2}-\d{2}$/.test(reg);
    const r = e.status !== "approved" ? "not approved (" + (e.status || "no status") + ")"
      : !e.hotelId ? "no hotel assigned"
      : !byHotel[e.hotelId] ? "hotel id not found: " + e.hotelId
      : !regOk ? "registration date unreadable: " + reg
      : "IN THE SHEET";
    why.push((e.fullName || e.email || e.uid) + " → " + r);
  });
  const inSheet = why.filter(x => x.indexOf("IN THE SHEET") > 0).length;
  Logger.log("range " + from + " … " + today);
  Logger.log("employees " + employees.length + ", of them in the sheet " + inSheet);
  Logger.log("attendance docs " + all.length + ", in range " + recs.length + ", days with records " + Object.keys(dates).length);
  Logger.log("last days: " + Object.keys(dates).sort().slice(-7).map(d => d + "=" + dates[d]).join("  "));
  why.forEach(x => Logger.log("  " + x));
  note("v" + SCRIPT_VERSION + " · " + employees.length + " staff · " + inSheet + " should appear · " + recs.length + " records in " + Object.keys(dates).length + " days (" + from + "…" + today + "). Details: Executions → View logs.");
}

/**
 * One line per registered person: is he in the attendance tab, and if not, why.
 * Written on every sync, so a missing colleague is always explainable without opening the script.
 */
function writeSyncReport(employees, byHotel, recs, from, today){
  const seen = {}; recs.forEach(r => { seen[r.uid] = (seen[r.uid] || 0) + 1; });
  const rows = employees.map(e => {
    const reg = String(e.createdAt || "").slice(0, 10), regOk = /^\d{4}-\d{2}-\d{2}$/.test(reg);
    const hotel = e.hotelId ? byHotel[e.hotelId] : null;
    const reason = (e.status || "pending") !== "approved" ? "NOT in the sheet — profile is " + (e.status || "pending") + " (approve in the Roster)"
      : !e.hotelId ? "NOT in the sheet — no hotel assigned (Roster → open the person → Hotel)"
      : !hotel ? "NOT in the sheet — hotel id not found: " + e.hotelId + " (re-assign the person)"
      : "in the sheet";
    return [e.fullName || "", e.email || "", e.status || "pending", hotel ? hotel.name : (e.hotelId || ""), reason.indexOf("NOT") === 0 ? "no" : "yes", reason, regOk ? reg : "(registration date unreadable: " + reg + ")", seen[e.uid] || 0];
  }).sort((a, b) => String(a[4]).localeCompare(String(b[4])) || String(a[0]).localeCompare(String(b[0])));
  const days = {}; recs.forEach(r => { days[r.date] = 1; });
  rows.push([], ["Range", from + " … " + today, "", "", "", "Registered people: " + employees.length + " · in the sheet: " + rows.filter(r => r[4] === "yes").length, "", ""],
            ["Attendance records in range", recs.length, "", "", "", "Days with records: " + Object.keys(days).length, "", ""]);
  writeTab(REPORT_TAB, ["Name", "Email", "Status", "Hotel", "In the sheet", "Why", "Registered", "Records in range"], rows);
}

/**
 * Write one of the script's own tabs. Two traps this guards against, both of which used to
 * abort the write half way and leave a tab holding only the first row(s):
 *  - a cell that is undefined or an object, or a row that is not the width of the header;
 *  - a leftover dropdown (data validation) that refuses any value outside its list.
 * If the tab still refuses the data, it is deleted and recreated clean, then written again.
 */
function writeTab(name, header, rows){
  const safe = rows.map(r => { const out = []; for (let i = 0; i < header.length; i++){ const v = r[i]; out.push(v === undefined || v === null ? "" : (typeof v === "number" || typeof v === "string" || typeof v === "boolean" ? v : String(v))); } return out; });
  try { fillTab(name, header, safe, false); }
  catch (err) { Logger.log("writeTab " + name + " failed (" + err + ") — rebuilding the tab"); fillTab(name, header, safe, true); }
}
function fillTab(name, header, safe, rebuild){
  const ss = SpreadsheetApp.getActive(); let sh = ss.getSheetByName(name);
  if (sh && rebuild){ const at = sh.getIndex(); ss.deleteSheet(sh); sh = ss.insertSheet(name, at - 1); }   // start from a clean tab: no rules, no formats
  if (!sh) sh = ss.insertSheet(name);
  const need = safe.length + 1;
  if (sh.getMaxRows() < need) sh.insertRowsAfter(sh.getMaxRows(), need - sh.getMaxRows());
  if (sh.getMaxColumns() < header.length) sh.insertColumnsAfter(sh.getMaxColumns(), header.length - sh.getMaxColumns());
  sh.getRange(1, 1, sh.getMaxRows(), sh.getMaxColumns()).clearDataValidations();
  sh.clearContents(); sh.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight("bold");
  if (safe.length) sh.getRange(2, 1, safe.length, header.length).setValues(safe);
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
const PORTAL_URL = "https://seifabas33-pixel.github.io/joyBoy-agency/team/";
const REMIND_BEFORE = 30;             // minutes before a shift starts that the reminder goes out

/* ───────────────────── push notifications to the staff phones ─────────────────────
 * Firebase Cloud Messaging, sent with your own Google account — no paid plan and no server.
 * Needs "https://www.googleapis.com/auth/firebase.messaging" in appsscript.json (see the header),
 * and a Web Push certificate key pasted into team/firebase-config.js by Claude.
 * Run installPushTriggers() once; after that pushTick() runs every 15 minutes and
 *   1. reminds scheduled staff about a shift that starts in ~30 minutes and that they have not checked into,
 *   2. sends anything the office queued from the admin page (a message, the programme, a payslip).
 */
function restPatch(path, fields){
  const enc = v => typeof v === "number" ? (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }) : typeof v === "boolean" ? { booleanValue: v } : { stringValue: String(v) };
  const mask = Object.keys(fields).map(k => "updateMask.fieldPaths=" + k).join("&");
  const res = UrlFetchApp.fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${path}?${mask}`,
    { method: "patch", contentType: "application/json", headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() }, payload: JSON.stringify({ fields: Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, enc(v)])) }), muteHttpExceptions: true });
  if (res.getResponseCode() >= 300) Logger.log("patch " + path + " → " + res.getContentText().slice(0, 200));
}
function restDelete(path){
  UrlFetchApp.fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${path}`,
    { method: "delete", headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
}
/** Every registered phone of the given people: [{uid, id, token}]. */
function devicesOf(uids){
  const out = [];
  uids.forEach(uid => { try { fetchAll("employees/" + uid + "/devices").forEach(d => { if (d.f && d.f.token) out.push({ uid, id: d.id, token: d.f.token }); }); } catch (e) { Logger.log("devices " + uid + ": " + e); } });
  return out;
}
/** Send one data-only message to each device; a phone that is gone is removed from the list. */
function sendPush(devices, title, body, url, tag){
  if (!devices.length) return 0;
  const reqs = devices.map(d => ({
    url: `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`, method: "post", contentType: "application/json",
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
    payload: JSON.stringify({ message: { token: d.token, data: { title: String(title), body: String(body), url: url || PORTAL_URL, tag: tag || "joyboy" }, webpush: { headers: { Urgency: "high", TTL: "7200" } } } }),
    muteHttpExceptions: true,
  }));
  let sent = 0;
  UrlFetchApp.fetchAll(reqs).forEach((res, i) => {
    const code = res.getResponseCode();
    if (code < 300) { sent++; return; }
    const txt = res.getContentText();
    if (code === 404 || txt.indexOf("UNREGISTERED") >= 0 || txt.indexOf("INVALID_ARGUMENT") >= 0){ restDelete("employees/" + devices[i].uid + "/devices/" + devices[i].id); Logger.log("dropped a dead phone for " + devices[i].uid); }
    else Logger.log("push failed (" + code + "): " + txt.slice(0, 200));
  });
  return sent;
}
function pushTick(){
  const props = PropertiesService.getScriptProperties();
  const today = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd"), nowMin = toMin(hhmm(new Date()));
  const employees = fetchAll("employees").map(d => ({ uid: d.id, ...d.f })).filter(e => e.status === "approved" && e.hotelId);
  const hotels = fetchAll("hotels").map(d => ({ id: d.id, ...d.f })), byHotel = {}; hotels.forEach(h => { byHotel[h.id] = h; });
  const att = fetchAll("attendance").map(d => ({ id: d.id, ...d.f })).filter(r => r.date === today);
  const plans = fetchAll("plans").map(d => ({ id: d.id, ...d.f })).filter(p => p.date === today);
  let sent = 0;

  // 1. shift reminders
  hotels.filter(h => h.active !== false).forEach(h => {
    const plan = plans.filter(p => p.hotelId === h.id)[0] || null;
    hotelShifts(h).forEach(sh => {
      const mins = toMin(sh.start) - nowMin;
      if (mins > REMIND_BEFORE + 10 || mins < REMIND_BEFORE - 20) return;              // only the window around "30 minutes before"
      const key = "rem_" + today + "_" + h.id + "_" + sh.key; if (props.getProperty(key)) return;
      const due = employees.filter(e => e.hotelId === h.id)
        .filter(e => scheduledShifts(hotelShifts(h), plan, e.uid).some(s => s.key === sh.key))
        .filter(e => !att.some(r => r.uid === e.uid && r.shift === sh.key && r.checkInAt))
        .filter(e => !att.some(r => r.uid === e.uid && !r.shift && r.override));
      const spotKey = plan && plan.shifts && plan.shifts[sh.key] ? plan.shifts[sh.key].spot : "";
      const spot = spotKey && h.spots && h.spots[spotKey] ? h.spots[spotKey].name : "";
      if (due.length) sent += sendPush(devicesOf(due.map(e => e.uid)), sh.name + " shift at " + sh.start, "Check in at " + (spot ? "the " + spot : h.name) + " when you arrive.", PORTAL_URL, "shift-" + sh.key);
      props.setProperty(key, "1");
    });
  });

  // 2. whatever the office queued from the admin page
  const queue = fetchAll("notify").map(d => ({ id: d.id, ...d.f })).filter(n => !n.sentAt);
  queue.forEach(n => {
    const uids = (n.uids && n.uids.length) ? n.uids : employees.filter(e => !n.hotelId || e.hotelId === n.hotelId).map(e => e.uid);
    const n2 = sendPush(devicesOf(uids), n.title || "Joy Boy", n.body || "", n.url || PORTAL_URL, n.tag || "office");
    sent += n2;
    restPatch("notify/" + n.id, { sentAt: new Date().toISOString(), sentTo: n2 });
  });

  if (sent) Logger.log("pushTick sent " + sent + " notifications");
  return sent;
}
function installPushTriggers(){
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === "pushTick").forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("pushTick").timeBased().everyMinutes(15).create();
  note("v" + SCRIPT_VERSION + " · Reminders are live: the script checks every 15 minutes.");
}
/** Send yourself a test notification (register your phone in the portal first). */
function testPush(){
  const me = fetchAll("employees").map(d => ({ uid: d.id, ...d.f })), devs = devicesOf(me.map(e => e.uid));
  note("v" + SCRIPT_VERSION + " · " + devs.length + " registered phone(s); sent " + sendPush(devs, "Joy Boy test", "If you can read this, reminders work.", PORTAL_URL, "test"));
}

function installDigestTriggers(){
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === "sendDigest").forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("sendDigest").timeBased().atHour(10).nearMinute(30).everyDays(1).inTimezone(TZ).create();
  ScriptApp.newTrigger("sendDigest").timeBased().atHour(20).nearMinute(30).everyDays(1).inTimezone(TZ).create();
  note("Done — the office gets a digest at about 10:30 and 20:30 Egypt time.");
}

function sendDigest(){
  const today = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd"), nowMin = toMin(hhmm(new Date()));
  const employees = fetchAll("employees").map(d => ({ uid: d.id, ...d.f }));
  const hotels = Object.fromEntries(fetchAll("hotels").map(d => [d.id, d.f]));
  const att = fetchAll("attendance").map(d => ({ id: d.id, ...d.f })).filter(r => r.date === today);
  const plansToday = fetchAll("plans").map(d => ({ id: d.id, ...d.f })).filter(p => p.date === today);
  const reqs = fetchAll("requests").map(d => ({ id: d.id, ...d.f })).filter(r => r.status === "open");
  const admins = fetchAll("admins").map(d => d.id);
  const to = [...new Set(BUILT_IN_ADMINS.concat(admins))].join(",");
  const name = e => e.preferredName || e.fullName || e.email;
  const pending = employees.filter(e => (e.status || "pending") === "pending");
  const active = employees.filter(e => e.status === "approved" && e.hotelId);
  const late = [], absent = [], present = [], perShift = {};
  active.forEach(e => { const h = hotels[e.hotelId] || {}, shifts = scheduledShifts(hotelShifts(h), plansToday.find(p => p.hotelId === e.hotelId), e.uid), dayRec = att.find(a => a.uid === e.uid && !a.shift) || null, srecs = att.filter(a => a.uid === e.uid && a.shift);
    const ds = dayStatus(dayRec, srecs, shifts, h, today, today);
    if (dayRec && dayRec.override) return;                                   // sick / vacation / off / marked by the office
    if (!shifts.length) return;                                              // scheduled day off
    if (ds.legacy){ if (ds.review) late.push(`${name(e)} — ${h.name || ""}, in at ${hhmm(ds.legacy.checkInAt)} (old day format)`); else present.push(name(e)); return; }
    let any = false;
    ds.shifts.forEach(y => { const k = y.sh.name; perShift[k] = perShift[k] || { started: 0, in: 0 };
      const started = nowMin > toMin(y.sh.start) + (y.sh.graceMin == null ? 5 : +y.sh.graceMin);
      if (started) perShift[k].started++;
      if (y.r && y.r.checkInAt){ any = true; perShift[k].in++; if (y.st.review) late.push(`${name(e)} — ${h.name || ""}, ${k} in at ${hhmm(y.r.checkInAt)} (${y.st.lateMin} min late)`); }
      else if (started && !y.r) absent.push(`${name(e)} — ${h.name || ""}, ${k}`); });
    if (any) present.push(name(e)); });
  const lines = [];
  lines.push(`Joy Boy office digest — ${today} ${hhmm(new Date())} (Egypt time)`, "");
  lines.push(`Checked in today: ${present.length} of ${active.length} assigned staff.`, ...Object.keys(perShift).filter(k => perShift[k].started).map(k => `  ${k}: ${perShift[k].in} of ${perShift[k].started} checked in`), "");
  if (pending.length) lines.push(`PENDING REGISTRATIONS (${pending.length}):`, ...pending.map(e => `  • ${name(e)} — ${e.email}`), "");
  if (late.length) lines.push(`LATE CHECK-INS — NEED A DECISION (${late.length}):`, ...late.map(x => "  • " + x), "");
  if (reqs.length) lines.push(`REQUESTS FROM STAFF (${reqs.length}):`, ...reqs.map(r => `  • ${r.name || r.email} — ${r.date}${r.shiftName ? " " + r.shiftName : ""}: "${r.reason}"`), "");
  if (absent.length) lines.push(`MISSED SHIFT CHECK-INS (${absent.length}):`, ...absent.map(x => "  • " + x), "");
  if (!pending.length && !late.length && !reqs.length && !absent.length) lines.push("Nothing needs a decision right now.", "");
  lines.push(`Decide here: ${ADMIN_URL}#att`, "", "This e-mail is generated by the attendance sheet script. Personal data — do not forward outside the office.");
  const todo = pending.length + late.length + reqs.length;
  MailApp.sendEmail({ to, subject: `Joy Boy · ${today} · ${todo ? todo + " to decide" : "all clear"} · ${present.length}/${active.length} present`, body: lines.join("\n"), name: "Joy Boy office" });
  try { SpreadsheetApp.getActive().toast("Digest sent to " + to.split(",").length + " office accounts", "Joy Boy", 5); } catch (e) {}
}
