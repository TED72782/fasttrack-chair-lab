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
  S.start=3; S.len=20; S.level=1;                    // park the live lane far from the saved one
  const rowScore = scoreOf(board()[0].cfg, LEVELS[S.level].pts).score;
  try{
    const e=board().find(x=>String(x.at)==="42");
    S.budget=0; Object.assign(S, sane(e.cfg));       // mirrors the shipped handler
    PICK = sane(e.cfg).cc === undefined ? new Set(CC.map(x=>x.i))
         : new Set(String(sane(e.cfg).cc).split(".").filter(v=>v!=="").map(Number));
    drawModes(); drawSpaces(); drawWindow(); run(); S.A=5; run();
  }catch(err){ zOk=false; zMsg=err.message }
  console.log("legacy zone row loads       :", zOk ? "yes (as "+S.mode+")" : "FAIL — "+zMsg);
  /* ⚠ LOADING A ROW MUST GIVE BACK THE LANE THAT WAS RANKED. A row saved before the window was
     adjustable carries no start/len, and Object.assign(cfg) left whatever the current user was
     looking at in place — so the row was SCORED as the 15:00-23:00 lane and LOADED as a 20-hour
     one. sane() supplies the same defaults to both sides. */
  S.A=2; run();
  console.log("legacy load restores 15-23  :", S.start===15 && S.len===8 ? "yes"
              : "FAIL — got "+S.start+"/"+S.len);
  const live = evaluate({mode:S.mode,A:S.A,R:S.R,cyc:S.cyc,assess:S.assess,
                         fastDischarge:S.fastDischarge, cc:[...PICK].sort((a,b)=>a-b).join("."),
                         start:S.start, len:S.len, bar:S.bar}, LEVELS[S.level].pts).score;
  console.log("loaded lane reproduces score:", Math.abs(live-rowScore) < 1.5
              ? "yes ("+live.toFixed(1)+" vs "+rowScore.toFixed(1)+")"
              : "FAIL — "+live.toFixed(1)+" live vs "+rowScore.toFixed(1)+" on the board");

  /* ⚠ A LINK IS NOT TRUSTED INPUT. People edit them and chat clients truncate them; a NaN
     reaching new Array(S.A) in drawStageIdle threw before a single handler was wired, so Add /
     Play / Copy link were all dead on a page that otherwise looked fine. */
  let hOk = true, hMsg = "";
  for(const h of ["split,x,4,76,44,0,1,15,8", "split,-3,4,76,44,0,1,15,8", "split,,,,,,,,",
                  "split,6,4,76,44,0,1,15,", "split,6.5,4,76,44,0,1,99,999"]){
    location.hash = "#" + h;
    try{ fromHash(); drawSpaces(); drawStageIdle(); run() }
    catch(err){ hOk=false; hMsg = h + " -> " + err.message; break }
  }
  console.log("malformed links survive     :", hOk ? "yes (clamped)" : "FAIL — "+hMsg);

  /* ⚠ THE BED-FIRST INVARIANT. With nobody bed-required, "a room if free, else a chair" is
     just one pool of A+R that nobody is ever moved out of — i.e. exactly the pooled lane. If
     these two ever separate, the placement logic has grown a cost that is not the rule it is
     supposed to be modelling, and the whole "what does the exclusion list cost" reading of the
     layout is void. Seed noise between two different RNG streams is the only gap allowed. */
  const cfgB = {cyc:76, assess:44, fastDischarge:false, start:15, len:8, bar:"today"};
  const bf0 = evaluate({...cfgB, mode:"bedfirst", A:6, R:4, bedcc:"", bedExtra:0}, LEVELS[2].pts).score;
  const pl  = evaluate({...cfgB, mode:"pooled",   A:10, R:0},             LEVELS[2].pts).score;
  console.log("bed-first at 0% == pooled   :", Math.abs(bf0-pl) < 0.5
              ? "yes ("+bf0.toFixed(1)+" vs "+pl.toFixed(1)+")"
              : "FAIL — "+bf0.toFixed(2)+" vs "+pl.toFixed(2));
  const bfHi = evaluate({...cfgB, mode:"bedfirst", A:2, R:8, bedcc:"", bedExtra:25}, LEVELS[2].pts).score;
  const bfLo = evaluate({...cfgB, mode:"bedfirst", A:8, R:2, bedcc:"", bedExtra:25}, LEVELS[2].pts).score;
  console.log("scarce rooms cost more      :", bfHi > bfLo + 1
              ? "yes (2rm "+bfHi.toFixed(1)+" vs 8rm "+bfLo.toFixed(1)+")"
              : "FAIL — 2rm "+bfHi.toFixed(1)+" vs 8rm "+bfLo.toFixed(1));
  /* The stage must replay the mode the numbers came from — a mode added to sim() but not to
     buildTrace() plays a different lane on screen from the one the cards describe. */
  S.mode="bedfirst"; S.A=6; S.R=4; S.bedExtra=25; run(); buildTrace();
  const bedStuck = PLAY.trace.filter(e=>e.ev==="stuck").length;
  const bedChair = PLAY.trace.filter(e=>e.ev==="second").length;
  console.log("stage runs the bed-first run:", bedStuck===0 && bedChair>0
              ? "yes (chairs used, nobody stuck)"
              : "FAIL — stuck="+bedStuck+" chair="+bedChair);
  /* ⚠ THE LIST IS THE CONTROL NOW. Ticking a complaint must move the share, and the share the
     panel reports must be the one the engine is handed — a list that renders but does not reach
     sim() is worse than no list, because it looks vetted. */
  /* ⚠ AND IT MUST SURVIVE ITS OWN LOAD BUTTON. BEDPICK lives outside S, so Object.assign cannot
     carry it — the row came back SCORED on its own list and SHOWING whoever else's was loaded. */
  S.bedExtra = 12; BEDPICK = new Set([0,4]);
  const bedRow = {who:"bed", at: 77, cfg:{mode:"bedfirst", A:6, R:4, cyc:76, assess:44,
    fastDischarge:false, cc:CC.map(x=>x.i).join("."), start:15, len:8,
    bedcc:[...BEDPICK].sort((a,b)=>a-b).join("."), bedExtra:S.bedExtra}};
  saveLocal([bedRow]); drawBoard();
  const bedRowScore = scoreOf(bedRow.cfg, LEVELS[S.level].pts).score;
  BEDPICK = new Set(); S.bedExtra = 0; S.mode = "split";       // wipe it, as a load would find it
  const c2 = sane(bedRow.cfg);
  Object.assign(S, c2);
  PICK = c2.cc === undefined ? new Set(CC.map(x=>x.i)) : idSet(c2.cc);
  BEDPICK = c2.bedcc === undefined ? new Set(BED_IDS) : idSet(c2.bedcc);   // mirrors the handler
  run();
  const bedBack = [...BEDPICK].sort((a,b)=>a-b).join(".");
  console.log("load restores exclusion list:", bedBack==="0.4" && S.bedExtra===12
      ? "yes" : "FAIL — list="+bedBack+" extra="+S.bedExtra);
  const liveBed = evaluate({mode:S.mode, A:S.A, R:S.R, cyc:S.cyc, assess:S.assess,
      fastDischarge:S.fastDischarge, cc:[...PICK].sort((a,b)=>a-b).join("."),
      bedcc:[...BEDPICK].sort((a,b)=>a-b).join("."), bedExtra:S.bedExtra,
      start:S.start, len:S.len, bar:S.bar}, LEVELS[S.level].pts).score;
  console.log("loaded bed lane scores same :", Math.abs(liveBed-bedRowScore) < 1.5
      ? "yes ("+liveBed.toFixed(1)+" vs "+bedRowScore.toFixed(1)+")"
      : "FAIL — "+liveBed.toFixed(1)+" vs "+bedRowScore.toFixed(1));
  saveLocal([]); BEDPICK = new Set(BED_IDS); S.bedExtra = 0; PICK = new Set(CC.map(x=>x.i)); BEDPICK = new Set(BED_IDS); run();
  const withList = liveBedShare();
  BEDPICK = new Set(); run();
  const noList = liveBedShare();
  BEDPICK = new Set(CC.map(x=>x.i)); run();
  const allList = liveBedShare();
  console.log("exclusion list drives share :",
    noList===0 && withList>0 && withList<1 && Math.abs(allList-1)<1e-9
      ? "yes (none 0% / Blake's "+(100*withList).toFixed(0)+"% / all 100%)"
      : "FAIL — none="+noList+" blake="+withList+" all="+allList);
  BEDPICK = new Set(BED_IDS); S.bedExtra = 50; run();
  console.log("residual composes with list :", Math.abs(liveBedShare() - (withList + (1-withList)*0.5)) < 1e-9
      ? "yes" : "FAIL — got "+liveBedShare());
  S.bedExtra = 0;

  location.hash = ""; S.mode="split"; S.A=6; S.R=4; S.start=15; S.len=8; saveLocal([]);

  console.log("\nsample markup:", A.slice(A.indexOf("<span class=\"slot full"), A.indexOf("<span class=\"slot full")+230).replace(/\s+/g," "));
},60);
