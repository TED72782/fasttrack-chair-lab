/**
 * Fast Track Chair Lab — shared leaderboard.
 *
 * Paste this whole file into a new Apps Script project bound to a Google Sheet, deploy it as a
 * Web app ("Execute as: Me", "Who has access: Anyone"), and paste the /exec URL it gives you
 * into the lab page. Nothing else to configure.
 *
 * The sheet becomes the board: one row per lane, columns who / mode / A / R / cyc / assess /
 * fastDischarge / at. Sort or annotate it freely — the page only ever reads these columns.
 */

var SHEET = 'board';

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET);
    sh.appendRow(['who', 'mode', 'A', 'R', 'cyc', 'assess', 'fastDischarge', 'at']);
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function read_() {
  var rows = sheet_().getDataRange().getValues();
  var out = [];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0]) continue;
    out.push({
      who: String(r[0]).slice(0, 28),
      cfg: { mode: String(r[1]), A: Number(r[2]), R: Number(r[3]),
             cyc: Number(r[4]), assess: Number(r[5]), fastDischarge: r[6] === true || r[6] === 'TRUE' },
      at: Number(r[7]) || 0
    });
  }
  return out;
}

function doGet() {
  return json_(read_());
}

/**
 * The page posts text/plain on purpose. A JSON content-type would make the browser send a CORS
 * preflight, and Apps Script web apps cannot answer one — the request would fail before it ever
 * reached this function. text/plain is a "simple request", so it goes straight through.
 */
function doPost(e) {
  var lock = LockService.getScriptLock();       // two physicians clicking at once must not interleave
  try {
    lock.waitLock(8000);
    var b = JSON.parse(e.postData.contents);
    var who = String(b.who || '').slice(0, 28);
    var c = b.cfg || {};
    var modes = ['split', 'pooled', 'rooms', 'zone'];
    if (!who || modes.indexOf(String(c.mode)) < 0) return json_({ error: 'bad entry' });

    var sh = sheet_();
    var rows = sh.getDataRange().getValues();
    // one row per person per distinct lane — re-adding the same lane refreshes it in place
    for (var i = rows.length - 1; i >= 1; i--) {
      if (String(rows[i][0]) === who && String(rows[i][1]) === String(c.mode) &&
          Number(rows[i][2]) === Number(c.A) && Number(rows[i][3]) === Number(c.R) &&
          Number(rows[i][4]) === Number(c.cyc) && Number(rows[i][5]) === Number(c.assess)) {
        sh.deleteRow(i + 1);
      }
    }
    sh.appendRow([who, String(c.mode), Number(c.A) || 0, Number(c.R) || 0,
                  Number(c.cyc) || 0, Number(c.assess) || 0, c.fastDischarge === true,
                  Number(b.at) || Date.now()]);
    return json_(read_());
  } catch (err) {
    return json_({ error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}
