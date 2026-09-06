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
 * What it writes: a tab "Attendance (portal)" with one row per person and day
 * (date, name, email, hotel, check-in, check-out, status, late minutes, distance, override, by),
 * and a tab "Hotels (portal)". Other tabs in your sheet are never touched.
 * Status rule = the same one the portal uses: checked in by shift start + grace → Present,
 * later → Half day, no check-in → Absent; an admin override wins.
 */
const PROJECT_ID = "joy-boy-agency";
const DAYS_BACK = 62;                 // how much history to (re)write each run
const TZ = "Africa/Cairo";
const ATT_TAB = "Attendance (portal)", HOTEL_TAB = "Hotels (portal)";

function onOpen(){ SpreadsheetApp.getUi().createMenu("Joy Boy").addItem("Sync attendance now", "syncAttendance").addItem("Refresh every hour (install)", "installHourlyTrigger").addToUi(); }
function installHourlyTrigger(){ ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === "syncAttendance").forEach(t => ScriptApp.deleteTrigger(t)); ScriptApp.newTrigger("syncAttendance").timeBased().everyHours(1).create(); try { SpreadsheetApp.getUi().alert("Done — the sheet now refreshes every hour."); } catch (e) {} }

function syncAttendance(){
  const hotels = fetchAll("hotels").map(d => ({ id: d.id, ...d.f }));
  const employees = fetchAll("employees").map(d => ({ uid: d.id, ...d.f }));
  const from = Utilities.formatDate(new Date(Date.now() - DAYS_BACK * 864e5), TZ, "yyyy-MM-dd"), today = Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd");
  const recs = fetchAll("attendance").map(d => ({ id: d.id, ...d.f })).filter(r => r.date >= from);
  const byHotel = Object.fromEntries(hotels.map(h => [h.id, h]));
  const rows = [];
  for (let d = from; d <= today; d = addDays(d, 1)){
    const dayRecs = recs.filter(r => r.date === d);
    const people = employees.filter(e => e.status === "approved" && e.hotelId).map(e => ({ e, r: dayRecs.find(r => r.uid === e.uid) || null, hotelId: e.hotelId }));
    dayRecs.forEach(r => { if (!people.some(x => x.e.uid === r.uid)) people.push({ e: { fullName: r.name, email: r.email }, r, hotelId: r.hotelId }); });
    people.forEach(x => { const h = byHotel[x.hotelId] || {}; const st = status(x.r, h, d, today);
      rows.push([d, x.e.fullName || "", x.e.email || "", h.name || x.hotelId || "", x.r && x.r.checkInAt ? hhmm(x.r.checkInAt) : "", x.r && x.r.checkOutAt ? hhmm(x.r.checkOutAt) : "", st.label, st.lateMin == null ? "" : st.lateMin, x.r && x.r.distM != null ? x.r.distM : "", x.r && x.r.override ? x.r.override : "", x.r && x.r.overrideBy ? x.r.overrideBy : ""]); });
  }
  rows.sort((a, b) => (a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : String(a[3]).localeCompare(b[3]) || String(a[1]).localeCompare(b[1])));
  writeTab(ATT_TAB, ["Date","Name","Email","Hotel","Check-in","Check-out","Status","Late (min)","Distance (m)","Override","Override by"], rows);
  writeTab(HOTEL_TAB, ["Hotel","Town","Shift start","Grace (min)","Radius (m)","Active","Staff assigned"], hotels.map(h => [h.name, h.city || "", h.shiftStart, h.graceMin, h.radiusM, h.active === false ? "no" : "yes", employees.filter(e => e.hotelId === h.id && e.status === "approved").length]));
  SpreadsheetApp.getActive().toast("Attendance synced: " + rows.length + " rows", "Joy Boy", 5);
}

/* ── status rule (mirror of team/portal.js attStatus) ── */
const LABEL = { present: "Present", "half-day": "Half day", absent: "Absent", excused: "Excused", off: "Day off", pending: "Not yet" };
function status(r, h, date, today){
  const start = toMin(h.shiftStart) == null ? 540 : toMin(h.shiftStart), grace = h.graceMin == null ? 10 : +h.graceMin;
  if (r && r.override) return { label: LABEL[r.override] || r.override, lateMin: r.checkInAt ? Math.max(0, toMin(hhmm(r.checkInAt)) - start) : null };
  if (r && r.checkInAt){ const late = toMin(hhmm(r.checkInAt)) - start; return { label: late <= grace ? LABEL.present : LABEL["half-day"], lateMin: Math.max(0, late) }; }
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
