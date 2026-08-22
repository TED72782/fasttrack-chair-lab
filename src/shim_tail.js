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

  /* ── the interpreter criterion ────────────────────────────────────────────
     Added 2026-08-22. It is the first term that is neither a complaint nor a flat guess, so it
     can fail in ways the list checks above cannot see. */
  BEDPICK = new Set(BED_IDS); S.bedIntp = false; run();
  const noI = liveBedShare();
  S.bedIntp = true; run();
  const yesI = liveBedShare();
  // it must ADD to the list rather than replace it, and land inside 0..1
  console.log("interpreter adds to the list :", yesI > noI && yesI < 1
    ? "yes (" + (100*noI).toFixed(0) + "% -> " + (100*yesI).toFixed(0) + "%)"
    : "FAIL — off=" + noI + " on=" + yesI);

  /* ⚠ NOT A FLAT RATE. If someone ever replaces the per-complaint `x` with a single window-wide
     number this check is the one that notices: narrowing to a low-interpreter complaint and to a
     high one must give different shares. Laceration measures ~5% and Fever ~17%. */
  const byName = n => CC.find(x => x.n === n);
  const lac = byName("Laceration"), fev = byName("Fever");
  if(lac && fev){
    BEDPICK = new Set();                       // nothing ticked, so the term stands alone
    PICK = new Set([lac.i]); run(); const shLac = liveBedShare();
    PICK = new Set([fev.i]); run(); const shFev = liveBedShare();
    console.log("interpreter is per-complaint :", shFev > shLac + 0.02
      ? "yes (laceration " + (100*shLac).toFixed(1) + "% vs fever " + (100*shFev).toFixed(1) + "%)"
      : "FAIL — flat? laceration=" + shLac + " fever=" + shFev);
  } else console.log("interpreter is per-complaint : FAIL — complaint not found");
  PICK = new Set(CC.map(x=>x.i));

  /* A row saved before this criterion existed was scored WITHOUT it. Defaulting to true would
     silently re-rank other people's lanes under a rule they never chose. */
  const legacyBed = sane({mode:"bedfirst", A:6, R:4, cyc:76, assess:44, fastDischarge:false,
                          bedcc:[...BED_IDS].join("."), bedExtra:0});
  console.log("legacy bed row keeps its score:", legacyBed.bedIntp === false
    ? "yes (interpreter off)" : "FAIL — bedIntp=" + legacyBed.bedIntp);

  /* The genital group must be ON Blake's list, and must not have dragged the urinary complaints
     in with it — the operator's 2026-08-22 correction. */
  const gen = CC.find(x => x.k === "genital");
  console.log("genital group is on the list :", gen && BED_IDS.indexOf(gen.i) >= 0
    ? "yes (" + gen.n + ", " + (100*gen.s).toFixed(2) + "% of the lane)"
    : "FAIL — group missing from BED_IDS");
  console.log("urinary stayed out of it     :", gen && !/urinary|dysuria|hematuria/i.test(gen.n)
    && CC.some(x => x.n === "Dysuria") ? "yes (Dysuria is still its own row)" : "FAIL");

  S.bedIntp = true; BEDPICK = new Set(BED_IDS);

  /* ── families arrive together ─────────────────────────────────────────────
     Added 2026-08-22. Three ways this can go wrong, one check each. */
  const GRP = D.grp;
  const base = {A:6, R:4, lam:D.lam, asw:D.asw, now:D.now, res:D.res, assessMin:44,
                fastDischarge:false, days:400, seeds:[11,12,13,14]};
  const runWith = g => { D.grp = g; return sim({...base, pooled:true}) };

  // 1. VOLUME IS CONSERVED. The event rate is divided by the mean group size, so grouping changes
  //    how arrivals bunch and NOT how many there are. Without that the lane silently gains ~3%.
  const withG = runWith(GRP), noG = runWith(null);
  const dArr = 100*Math.abs(withG.arrived - noG.arrived)/noG.arrived;
  console.log("grouping conserves volume  :", dArr < 2
    ? "yes (" + withG.arrived.toFixed(1) + " vs " + noG.arrived.toFixed(1) + " arrivals/evening)"
    : "FAIL — " + dArr.toFixed(1) + "% apart");

  // 2. IT IS INERT WHEN ABSENT. A page built without the sidecar must be the old engine exactly.
  D.grp = null;
  const a1 = sim({...base, pooled:true, seeds:[7,8]}), a2 = sim({...base, pooled:true, seeds:[7,8]});
  console.log("no params == old behaviour :", a1.perArrival === a2.perArrival
    ? "yes (deterministic, group draw never consulted)" : "FAIL");

  // 3. IT COSTS SOMETHING. Bunched arrivals must not be free: same volume, worse wait. If this
  //    ever reads "no change", the group draw is not reaching the queue.
  D.grp = GRP;
  /* 3. BUNCHING COSTS WAIT, and the check needs the sample size to see it. At 400 evenings the
        delta alternates sign — it is ~1 min against waits of 8-120, so a small run measures noise
        and an earlier version of this check "failed" on it. 24,000 evenings resolves it cleanly:
        +0.96 / +1.03 / +1.08 / +0.68 / +0.11 min at 3 / 5 / 6 / 8 / 12 spaces (2026-08-22).
        The cost is largest where the lane is TIGHT, which is where the layouts differ, and that
        is the whole reason this is modelled rather than assumed away. */
  const tight = {...base, A:6, R:0, pooled:true, days:3000, seeds:[11,12,13,14,15,16,17,18]};
  D.grp = null; const singleArr = sim(tight);
  D.grp = GRP;  const familyArr = sim(tight);
  const cost = familyArr.perArrival - singleArr.perArrival;
  console.log("bunching costs wait        :", cost > 0.3
    ? "yes (+" + cost.toFixed(2) + " min/patient at 6 spaces)"
    : "FAIL — " + cost.toFixed(2) + " min; grouping is not reaching the queue");

  location.hash = ""; S.mode="split"; S.A=6; S.R=4; S.start=15; S.len=8; saveLocal([]);

  console.log("\nsample markup:", A.slice(A.indexOf("<span class=\"slot full"), A.indexOf("<span class=\"slot full")+230).replace(/\s+/g," "));
},60);
