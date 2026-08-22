# Fast Track Chair Lab — working notes

An interactive ED fast-track simulator for the Mary Bridge physician group. `index.html` is what
they open; it is a **build product** and must never be hand-edited.

## Build and check

```
python3 src/build.py        # src/{head,body}.html + app.js + data.json -> index.html AND src/shim.js
node src/shim.js            # headless harness — replays the animation against the SHIPPED bytes
node shared-board.test.js   # the Apps Script backend against a fake Google Sheet
```

`src/build.py` writes both `index.html` and the test harness from the same source, so the harness
always tests what ships. **Always rebuild before committing** — a stale `index.html` is the live
page being out of date.

The harness prints `yes` / `ok` per check and `FAIL — …` otherwise; nothing exits non-zero, so
read the output. There is no linter, no CI, no package.json.

Browser checks are worth running for anything touching layout or the DOM — Playwright and
Chromium are preinstalled (`/opt/pw-browsers`, `PLAYWRIGHT_BROWSERS_PATH` already set). Load
`file:///.../index.html`, and route `script.google.com` and `fonts.g*` to abort so the run is
offline and quiet.

## Invariants the harness guards

These exist because each one was a real bug. Do not weaken them to make a change pass.

- **A slot element is reused unless its occupant changes.** Rebuilding every frame restarts the
  `.22s` arrival animation 60×/sec and the figures are invisible while playing.
- **A control is built once per *shape*, never per value.** Re-rendering an `<input>` inside its
  own `oninput` replaces the element under the pointer and kills the drag after one step. Value
  changes go through the `sync*` functions.
- **A board row must load as the lane that was ranked.** `sane()` is the single reading of a row;
  scoring and the load button both go through it. State living outside `S` (`PICK`, `BEDPICK`)
  cannot ride `Object.assign` and must be restored explicitly — this has been the same bug twice.
- **A link is untrusted input.** Everything numeric clamps via `lim()`/`LIM`. A `NaN` reaching
  `new Array(S.A)` throws before any handler is wired and the whole page is dead.
- **Bed-first at 0% bed-required == pooled over the same estate.** If those separate, the
  placement logic has grown a cost that is not the rule it models.
- **The stage must run the model the numbers came from.** Anything `sim()` branches on must also
  be passed in `buildTrace()`, or the animation plays a different lane than the cards describe.

## Conventions

- **Nothing is a constant if nobody measured it.** Unmeasured quantities are controls with the
  assumption stated on screen (assessment time, the bed-required residual). Do not invent a
  default to make a panel look finished.
- **Figures the pipeline refreshes are not restated in `README.md`**, because nothing refreshes
  them there — describe the shape and point at the page. Prose numbers in the page come from
  `data.json.prose` via `{{token}}` substitution at build time so they cannot drift. The same
  rule applies to code comments: they rot, and have.
- **Every field the page sends must be stored by both backends** (`shared-board.gs`,
  `serve_board.py`). Adding a control means adding a column *and* an allowed mode to both.
  Dot-joined id lists (`cc`, `bedcc`) are written to Sheets with a leading apostrophe — a Sheet
  parses `'0.10'` into the number `0.1` and eats a complaint id.
- Comments here carry the *reason* and the failure that prompted it, marked `⚠`. Match that.

## Layouts

`split` (assess, then move to a second area) · `pooled` (one group, nobody moves) ·
`bedfirst` (**"The Blake"** — a room by default, chairs only once rooms are full, and a
bed-required list that never goes vertical; nobody moves).

Retired modes `zone`/`rooms` survive only as legacy board rows and fall back to `split`.

---

## Open threads (as of 2026-08-22 — re-check before relying on these)

**Settled — do not reopen without new information**

- **Child abuse** and **mental health** are both *outside this population*, not merely uncoded.
  Every encounter here is ESI 4/5 and neither is triaged there; a child-abuse concern is usually
  coded as `Well Child`, so it looks present and is not. Neither may be added to the bed-required
  share — that would charge the lane for people it never sees. Both confirmed by the physicians
  on 2026-08-22; `git log --grep="uncoded reason for a room"` has both.

**Questions out to the physicians**

1. **The residual share** ("plus this share of everyone else") ships at **0%**, which the page
   says outright is too low. Only triage can put the real number on it. Blake is the source.

**Work needing data nobody here has**

2. **GU complaints must be broken out of the 227-complaint bucket.** They *are* recorded at
   triage, but this build surfaces only `Dysuria`; genital/scrotal/testicular/vaginal, hematuria
   and frequency are inside `Everything else`, a single button worth 25% of volume. Until the
   extract gives them their own rows, Blake's "exams of sensitive areas" cannot be expressed as a
   list. Needs the complaint names + volumes from whoever runs the extract (`a03ba12`).
3. **Preferred language / interpreter need is not in the extract either.** It is a registration
   field, not a bedside judgement, so the non-English share is *measurable* — it is simply absent.
   Ask for it in the same breath as the GU complaints; both turn a slider guess into a number.
   Note the model routes these patients to a room but still gives them an average visit, so it
   captures the space an interpreted encounter needs and not the extra time it plausibly takes.

**Never verified from a sandbox**

4. **The baked-in shared board** (`DEFAULT_BOARD` in `src/app.js`) has never been reached — the
   agent proxy denies `script.google.com`. If it is dead, every physician silently gets a private
   board. Check the italic line in the leaderboard footer says *"shared board — everyone using
   this link sees the same list"*.
5. **The Apps Script deployment needs a new version pushed** (Deploy → Manage deployments → New
   version). The board schema changed twice on 2026-08-22 (`bedcc`, `bedExtra` replacing a
   short-lived `bedShare`). Until redeployed, Blake lanes save without their exclusion list.
6. **The live page** at `https://ted72782.github.io/ft-lab/` — the proxy denies `*.github.io`
   too, so it has only ever been verified from the built file and the repo contents.
7. **The engine-validation table** in `README.md` compares against a model that is not in this
   repo. It is labelled as a port-time record for that reason; do not "refresh" those numbers.
