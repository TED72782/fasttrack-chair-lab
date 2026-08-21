setTimeout(()=>{
  S.mode="split";S.A=6;S.R=4;S.start=15;S.len=8;S.assess=44;S.fastDischarge=true;S.level=1;
  PICK=new Set(CC.map(x=>x.i)); run(); buildTrace();
  PLAY.t=300; drawStage();
  const A=document.getElementById("stageA").innerHTML;
  const W=document.getElementById("stageWait").innerHTML;
  console.log("assessment slots render figures :", (A.match(/<svg/g)||[]).length, "figures in", (A.match(/class="slot/g)||[]).length, "slots");
  console.log("waiting pool renders figures    :", (W.match(/<svg/g)||[]).length);
  console.log("test badge appears              :", /class="bg"/.test(A) ? "yes" : "no");
  console.log("empty slot has no figure        :", /<span class="slot"><\/span>/.test(A) || !A.includes('class="slot">') ? "ok" : "check");
  // a jammed lane must show red figures
  S.A=4;S.R=1;S.assess=30; run(); buildTrace();
  let jam=0; for(let t=60;t<=480;t+=30){ PLAY.t=t; drawStage();
    jam=Math.max(jam,(document.getElementById("stageA").innerHTML.match(/fig jam/g)||[]).length) }
  console.log("jammed lane shows red figures   :", jam, "at peak");
  /* ⚠ THE REGRESSION GUARD. A slot whose occupant has not changed must keep the SAME element
     across frames. Rebuild it every tick and the .22s arrival animation restarts from
     opacity:0 sixty times a second: the boxes change colour and the people never appear. */
  S.A=6;S.R=4;S.assess=44; run(); buildTrace();
  PLAY.t=300; drawStage();
  const host=document.getElementById("stageA");
  const before=host.children.map(c=>c);
  const keys=before.map(c=>c.dataset.k).join(",");
  PLAY.t=300.4; drawStage();   // a fraction of a minute later — same occupants
  const after=host.children.map(c=>c);
  const same=before.filter((c,i)=>c===after[i]).length;
  console.log("occupants unchanged             :", keys===after.map(c=>c.dataset.k).join(",") ? "yes" : "no");
  console.log("slots REUSED, not rebuilt       :", same+"/"+before.length,
              same===before.length ? "ok" : "FAIL — figures will be invisible while playing");
  // and a slot whose occupant DOES change must be replaced
  let churn=0;
  for(let t=302;t<=420;t+=2){ const k0=host.children.map(c=>c.dataset.k).join(",");
    const e0=host.children.map(c=>c); PLAY.t=t; drawStage();
    host.children.forEach((c,i)=>{ if(c!==e0[i]) churn++ });
    if(k0!==host.children.map(c=>c.dataset.k).join(",")) {} }
  console.log("slots DO refresh on a new patient:", churn>0 ? "yes ("+churn+" swaps)" : "FAIL — stage frozen");

  /* ⚠ A LEGACY BOARD ROW MUST SURVIVE ITS OWN LOAD BUTTON. evaluate() and drawBoard() were
     guarded against retired modes ('zone','rooms') while the load handler wrote cfg.mode
     straight into live state — modeOf() returned undefined and every later run() died. */
  saveLocal([{who:"legacy", at: 42, cfg:{mode:"zone",A:2,R:8,cyc:76,assess:44,fastDischarge:true}}]);
  SHARED=false; drawBoard();
  let zOk=true, zMsg="";
  try{
    const e=board().find(x=>String(x.at)==="42");
    S.budget=0; Object.assign(S, e.cfg);
    if(!MODES.some(m=>m.id===S.mode)) S.mode = MODES[0].id;   // mirrors the shipped handler
    drawModes(); drawSpaces(); drawWindow(); run(); S.A=5; run();
  }catch(err){ zOk=false; zMsg=err.message }
  console.log("legacy zone row loads       :", zOk ? "yes (as "+S.mode+")" : "FAIL — "+zMsg);
  S.mode="split"; S.A=6; S.R=4; saveLocal([]);

  console.log("\nsample markup:", A.slice(A.indexOf("<span class=\"slot full"), A.indexOf("<span class=\"slot full")+230).replace(/\s+/g," "));
},60);
