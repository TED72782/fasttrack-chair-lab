const rows = [];
const sheet = {
  appendRow: r => rows.push(r.slice()),
  getDataRange: () => ({ getValues: () => rows.map(r => { const c=r.slice(); while(c.length<11)c.push(''); return c }) }),
  getLastColumn: () => rows.length ? rows[0].length : 0,
  getRange: (a,b,c,d) => ({ setValues: v => { rows[0] = v[0].slice() } }),
  deleteRow: i => rows.splice(i-1,1),
};
global.SpreadsheetApp = { getActiveSpreadsheet: () => ({ getSheetByName: () => rows.length?sheet:null, insertSheet: () => sheet }) };
global.ContentService = { createTextOutput: s => ({ setMimeType: () => s }), MimeType:{JSON:1} };
global.LockService = { getScriptLock: () => ({ waitLock(){}, releaseLock(){} }) };
eval(require('fs').readFileSync(__dirname + '/shared-board.gs','utf8'));

// 1. a v1 row, written before cc/start/len existed
sheet_(); rows.push(['Old Row','split',6,4,76,44,true,1000]);
// 2. a full modern entry
doPost({postData:{contents:JSON.stringify({who:'Park',cfg:{mode:'split',A:3,R:2,cyc:76,assess:30,
  fastDischarge:true,cc:'0.1.4',start:12,len:6},at:2000})}});
// 3. same person, same shape, DIFFERENT criteria — must be a separate row, not a replacement
doPost({postData:{contents:JSON.stringify({who:'Park',cfg:{mode:'split',A:3,R:2,cyc:76,assess:30,
  fastDischarge:true,cc:'0.1',start:12,len:6},at:2001})}});
// 3b. a MIDNIGHT lane: start 0 is a legal window, not a missing value
doPost({postData:{contents:JSON.stringify({who:'Night',cfg:{mode:'split',A:6,R:4,cyc:76,assess:44,
  fastDischarge:true,cc:'0.1',start:0,len:24},at:3000})}});
// 3c. same lane, fastDischarge FLIPPED — a different lane, must NOT replace the other
doPost({postData:{contents:JSON.stringify({who:'Park',cfg:{mode:'split',A:3,R:2,cyc:76,assess:30,
  fastDischarge:false,cc:'0.1.4',start:12,len:6},at:2500})}});
// 4. exact repeat of #2 — must replace it
doPost({postData:{contents:JSON.stringify({who:'Park',cfg:{mode:'split',A:3,R:2,cyc:76,assess:30,
  fastDischarge:true,cc:'0.1.4',start:12,len:6},at:2002})}});

const out = read_();
console.log('header       :', rows[0].join(','));
console.log('rows on board:', out.length, '(expect 5: legacy + two criteria sets + midnight + fd-flip)');
for(const e of out) console.log('  ', e.who.padEnd(9), 'cc=', String(e.cfg.cc), ' start=', String(e.cfg.start), ' len=', String(e.cfg.len));
const legacy = out.find(e=>e.who==='Old Row');
console.log('legacy cc/start/len undefined :', [legacy.cfg.cc,legacy.cfg.start,legacy.cfg.len].every(v=>v===undefined) ? 'yes' : 'FAIL');
const full = out.filter(e=>e.who==='Park');
console.log('criteria survive round trip   :', full.some(e=>e.cfg.cc==='0.1.4') && full.some(e=>e.cfg.cc==='0.1') ? 'yes' : 'FAIL');
console.log('hours survive round trip      :', full.every(e=>e.cfg.start===12 && e.cfg.len===6) ? 'yes' : 'FAIL');
console.log('exact repeat replaced, not dup:', full.filter(e=>e.cfg.cc==='0.1.4' && e.cfg.fastDischarge===true).length===1 ? 'yes' : 'FAIL');
const night = out.find(e=>e.who==='Night');
console.log('midnight start survives (0)   :', night && night.cfg.start===0 ? 'yes' : 'FAIL got '+(night&&night.cfg.start));
const fdPair = out.filter(e=>e.who==='Park' && e.cfg.cc==='0.1.4');
console.log('fd-flip kept as separate row  :', fdPair.length===2 ? 'yes' : 'FAIL got '+fdPair.length+' rows');
const rej = doPost({postData:{contents:JSON.stringify({who:'X',cfg:{mode:'zone',A:2,R:8},at:1})}});
console.log('retired mode rejected         :', String(rej).indexOf('error')>=0 ? 'yes' : 'FAIL got '+rej);
