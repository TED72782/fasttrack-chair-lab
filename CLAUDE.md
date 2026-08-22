# Fast Track Chair Lab — working notes

## Start here — what this is

Ted (`ted.kouo@gmail.com`) owns this. It is a **single-page simulator that a group of Mary Bridge
Children's ED physicians open in a browser** to argue about how to lay out a fast-track lane:
how many chairs, how many rooms, which patients it takes, what hours it runs. Live at
<https://ted72782.github.io/ft-lab/>. Ted sends that link to physicians; they are the users.

You build a **lane**, the page simulates thousands of evenings against service times measured
from the department's own ESI 4/5 encounters, and you put it on a **shared leaderboard** so the
group can compare. The score is **minutes of delay per ESI 4/5 patient arriving that day**, lower
is better, and today's arrangement scores **50.0** — that is the number to beat. Crucially the
score charges the lane for patients it *turns away* (wrong complaint, wrong hour) at the main
department's rate, so narrowing the criteria cannot win by shrinking.

**Nobody here is a software engineer.** Ted relays suggestions and corrections from physicians in
their words. When he says something is wrong, it is usually a *clinical* fact about how triage
actually works, not a bug report — and it usually changes what the model should do, not just the
wording. Take those at face value and follow them through the model.

### Who gets named

- **Blake** — physician who proposed the bed-first model. "The Blake" is his, and the
  bed-required exclusion list is his idea. He is the source for anything about that layout.
- **Mike Long**, **Park** — other physicians with named presets ("The Mike Long Play", "The Park
  Attack"). Just layout proposals; no ongoing thread.

### Vocabulary Ted uses

| he says | it means |
|---|---|
| the lab / the page / the link | `index.html`, live on GitHub Pages |
| a lane | one configuration: mode + spaces + hours + criteria |
| the board | the shared leaderboard, a Google Sheet behind an Apps Script web app |
| the criteria / who it accepts | the chief-complaint on/off panel |
| the exclusion list | the *separate* "must have a room" list, bed-first only |
| the residual | the "plus this share of everyone else" slider under that list |
| the extract | whoever pulls the ESI 4/5 data out of the source system |
| the bar / changing nothing | today's arrangement, 50.0 min |

## Where things stand (2026-08-22)

Two days of work, all merged to `main` and live. In order:

1. **A pre-release bug sweep** (`b85a4ab`). The page had no doctype (quirks mode) and no viewport
   meta, so every mobile breakpoint in the CSS was dead and phones got the desktop grid scaled
   down. A malformed `#` link threw before any handler was wired and killed the page. Board rows
   could load as a different lane than was ranked. Both backends lost fields.
2. **"The Blake"** (`8453778`) — a third layout mode, `bedfirst`. Not a preset: it is a routing
   *rule* neither existing mode could express. A room is the default; chairs are overflow used
   only once rooms are full; some patients cannot use a chair at all; nobody is moved once placed
   (his anti-churn point). Finding: on the same ten spaces it scores ≈ pooled and well ahead of
   the 6+4 split, so the rule is close to free — *while there are enough rooms*. It gets expensive
   fast on a chair-heavy footprint.
3. **The exclusion list** (`dc029d9`) — Blake's point is that the MD group signs off an *explicit*
   list, so it is a tickable panel of complaints plus a residual slider, not a hidden number.
4. **Four scope corrections from Ted**, each of which changed the model (`dda7ffd`, `a03ba12`,
   `dc75524`, `0899983`): child abuse and mental health are outside the ESI 4/5 population; GU
   concerns are recorded but hidden in an aggregate bucket; not speaking English belongs on the
   list and is measurable.

**What the score cannot say, and the page says so loudly:** Blake proposed bed-first for privacy,
thoroughness behind a door, and fewer handoffs. None of that is in the model. It prices what the
rule *costs* in minutes. Do not let the lab read as a verdict on his argument.

---

## Build and check

```
python3 src/build.py        # src/{head,body}.html + app.js + data.json -> index.html AND src/shim.js
node src/shim.js            # headless harness — replays the animation against the SHIPPED bytes
node shared-board.test.js   # the Apps Script backend against a fake Google Sheet
```

`index.html` is a **build product — never hand-edit it.** `src/build.py` writes both it and the
test harness from the same source, so the harness always tests what ships. **Always rebuild
before committing** — a stale `index.html` is the live page being out of date.

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
- Comments carry the *reason* and the failure that prompted it, marked `⚠`. Match that. Commit
  messages do the same: `git log` is the narrative record of why things are the way they are.

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

1. **The residual share** — the "plus this share of everyone else" slider under the exclusion
   list, which stands for the reasons a patient needs a room that no chief complaint records.
   Ships at **0%**, which the page says outright is too low. Only triage can put the real number
   on it. Blake is the source.

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

**Never verified from a sandbox** (the agent proxy denies both hosts, so these need Ted's laptop)

4. **The baked-in shared board** (`DEFAULT_BOARD` in `src/app.js`) has never been reached —
   `script.google.com` is denied. If it is dead, every physician silently gets a private board.
   Check the italic line in the leaderboard footer says *"shared board — everyone using this link
   sees the same list"*.
5. **The Apps Script deployment needs a new version pushed** (Deploy → Manage deployments → New
   version). The board schema changed twice on 2026-08-22 (`bedcc`, `bedExtra` replacing a
   short-lived `bedShare`). Until redeployed, Blake lanes save without their exclusion list.
6. **The live page** — `*.github.io` is denied too, so it has only ever been verified from the
   built file and the repo contents.
7. **The engine-validation table** in `README.md` compares against a model that is not in this
   repo. It is labelled as a port-time record for that reason; do not "refresh" those numbers.
