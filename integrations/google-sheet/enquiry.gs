/**
 * AP Creative Studio - website enquiry receiver (Google Apps Script web app).
 *
 * Lives INSIDE the Google Sheet that should receive the enquiries (Extensions > Apps Script).
 * The website's server (/api/enquiry) posts every popup enquiry here with a secret; this script
 * appends it as one row in the "Website Enquiries" tab, reads the row back, and only then answers
 * { ok: true } - so the popup can show "Thank you" only for enquiries that really were saved.
 *
 * It never touches the Google Form or the form's own response tab.
 * Setup steps: integrations/google-sheet/README.md
 */

// 1) Choose any long random password and paste it here. The SAME value goes into Vercel as
//    ENQUIRY_SCRIPT_SECRET. Anyone without it is rejected.
var SECRET = 'PASTE_YOUR_SECRET_HERE';

var TAB = 'Website Enquiries';
var HEADERS = [
  'Received (IST)', 'Full name', 'Email', 'LinkedIn', 'WhatsApp',
  'Service', 'Requirements', 'Timeline', 'Showcase permission', 'Request ID'
];

function doPost(e) {
  var out;
  try {
    out = handle_(e);
  } catch (err) {
    console.error(err && err.stack ? err.stack : String(err)); // never echo internals to the caller
    out = { ok: false, error: 'error' };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

// Opening the URL in a browser only shows this; nothing is read or written.
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'post_only' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function clip_(v) {
  return String(v == null ? '' : v).slice(0, 2000);
}

function handle_(e) {
  if (!e || !e.postData || !e.postData.contents) return { ok: false, error: 'invalid' };
  var d = JSON.parse(e.postData.contents);
  if (!d || typeof d !== 'object') return { ok: false, error: 'invalid' };

  if (!SECRET || SECRET.indexOf('PASTE_') === 0 || d.secret !== SECRET) return { ok: false, error: 'bad_secret' };

  var id = String(d.id || '');
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(id)) return { ok: false, error: 'invalid' };

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { ok: false, error: 'busy' };
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(TAB);
    if (!sheet) sheet = ss.insertSheet(TAB);
    if (sheet.getLastRow() === 0) { // new (or emptied) tab: write the header row first
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    var idCol = HEADERS.length;
    var last = sheet.getLastRow();

    // Same request id already saved (a retry after a timeout) -> confirm it, do not add a second row.
    if (last > 1) {
      var ids = sheet.getRange(2, idCol, last - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        if (String(ids[i][0]) === id) return { ok: true, id: id, row: i + 2, duplicate: true };
      }
    }

    var stamp = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd MMM yyyy, hh:mm a');
    var row = [stamp, d.fullName, d.email, d.linkedin, d.whatsapp, d.service, d.requirements, d.timeline, d.showcase, id].map(clip_);
    var r = Math.max(last, 1) + 1;
    // Plain-text cells: nothing a visitor types can ever be run as a spreadsheet formula.
    sheet.getRange(r, 1, 1, row.length).setNumberFormat('@').setValues([row]);
    SpreadsheetApp.flush();

    // Read it back: only a row that is really there counts as saved.
    if (String(sheet.getRange(r, idCol).getValue()) !== id) return { ok: false, error: 'verify_failed' };
    return { ok: true, id: id, row: r };
  } finally {
    lock.releaseLock();
  }
}
