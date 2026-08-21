/**
 * Fast Track Chair Lab — shared leaderboard.
 *
 * Paste this whole file into a new Apps Script project bound to a Google Sheet, deploy it as a
 * Web app ("Execute as: Me", "Who has access: Anyone"), and paste the /exec URL it gives you
 * into the lab page. Nothing else to configure.
 *
 * The sheet becomes the board: one row per lane, columns who / mode / A / R / cyc / assess /
 * fastDischarge / at / cc / start / len. Sort or annotate it freely — the page only ever reads
 * these columns.
 *
 * ⚠ cc IS WRITTEN AS TEXT ON PURPOSE. A Sheet parses what it is handed: appendRow('0.10')
 * stores the NUMBER 0.1, and reading it back gives "0.1" — complaints {0,10} silently become
 * {0,1} and the row scores a lane nobody built. The leading apostrophe forces the cell to text;
 * Sheets strips it on read, and read_() strips one anyway so neither half depends on the other.
 *
 * ⚠ EVERY FIELD THE PAGE SENDS MUST BE STORED. The first version kept only the first eight
 * columns, silently dropping the chief-complaint criteria and the operating hours. A row saved
 * from a narrowed lane came back as an everyone-24/7 lane, so the board re-scored it against a
 * configuration nobody had chosen and the load button could not reproduce it. Adding a control
 * to the page means adding a column here.
 */

var SHEET = 'board';
var HEAD = ['who', 'mode', 'A', 'R', 'cyc', 'assess', 'fastDischarge', 'at',
            'cc', 'start', 'len'];

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET);
    sh.appendRow(HEAD);
  } else if (sh.getLastColumn() < HEAD.length) {
    sh.getRange(1, 1, 1, HEAD.length).setValues([HEAD]);   // widen a board written by v1
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
      // a v1 row has no cc/start/len: leaving them undefined is exactly how the page reads
      // "every complaint, the original 15:00-23:00 lane", so old rows keep scoring as they did
      cfg: { mode: String(r[1]), A: Number(r[2]), R: Number(r[3]),
             cyc: Number(r[4]), assess: Number(r[5]), fastDischarge: r[6] === true || r[6] === 'TRUE',
             cc: r[8] === '' || r[8] === undefined ? undefined : String(r[8]).replace(/^'/, ''),
             start: r[9] === '' || r[9] === undefined ? undefined : Number(r[9]),
             len: r[10] === '' || r[10] === undefined ? undefined : Number(r[10]) },
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
    var modes = ['split', 'pooled'];   // 'rooms'/'zone' retired with the four-mode UI
    if (!who || modes.indexOf(String(c.mode)) < 0) return json_({ error: 'bad entry' });

    var sh = sheet_();
    var rows = sh.getDataRange().getValues();
    // one row per person per distinct lane — re-adding the same lane refreshes it in place
    for (var i = rows.length - 1; i >= 1; i--) {
      if (String(rows[i][0]) === who && String(rows[i][1]) === String(c.mode) &&
          Number(rows[i][2]) === Number(c.A) && Number(rows[i][3]) === Number(c.R) &&
          Number(rows[i][4]) === Number(c.cyc) && Number(rows[i][5]) === Number(c.assess) &&
          (rows[i][6] === true || rows[i][6] === 'TRUE') === (c.fastDischarge === true) &&
          String(rows[i][8] || '').replace(/^'/, '') === String(c.cc || '') &&
          Number(rows[i][9] === '' ? 15 : rows[i][9]) === Number(c.start === undefined ? 15 : c.start) &&
          Number(rows[i][10] === '' ? 8 : rows[i][10]) === Number(c.len === undefined ? 8 : c.len)) {
        sh.deleteRow(i + 1);
      }
    }
    sh.appendRow([who, String(c.mode), Number(c.A) || 0, Number(c.R) || 0,
                  Number(c.cyc) || 0, Number(c.assess) || 0, c.fastDischarge === true,
                  Number(b.at) || Date.now(),
                  c.cc === undefined || c.cc === '' ? '' : "'" + String(c.cc),
                  c.start === undefined || c.start === null || c.start === '' ? 15 : Number(c.start),
                  c.len === undefined || c.len === null || c.len === '' ? 8 : Number(c.len)]);
    return json_(read_());
  } catch (err) {
    return json_({ error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}
