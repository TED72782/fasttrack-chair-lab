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

  location.hash = ""; S.mode="split"; S.A=6; S.R=4; S.start=15; S.len=8; saveLocal([]);

  console.log("\nsample markup:", A.slice(A.indexOf("<span class=\"slot full"), A.indexOf("<span class=\"slot full")+230).replace(/\s+/g," "));
},60);
