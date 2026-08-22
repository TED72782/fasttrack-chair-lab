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

## Where we left off (2026-08-22)

**Status: everything is shipped.** All work is merged to `main`, pushed, and live on GitHub
Pages. Working tree clean, nothing half-finished, no branch waiting to merge. The last thing done
was a scope correction from Ted (mental health is not ESI 4/5). If Ted says "continue", he means
one of the **Next actions** below, not unfinished code.

### What the lab now concludes

Re-run before quoting — these move with each data cut. Busy day (63 patients), lane open
15:00–23:00, assessment ending at 44 min, a no-test patient keeping the space:

| lane, same ten spaces | score |
|---|---|
| pooled 10 | 28.9 |
| **The Blake** — 6 rooms + 4 chairs, Blake's list | **29.2** |
| split 6+4 | 36.8 |
| *changing nothing (the bar)* | *50.0* |

**The headline for Blake: his rule is close to free.** Bed-first lands level with the best layout
the lab had, while delivering the privacy and no-churn benefits the score cannot see. But it
depends entirely on having rooms — at a flat 25% bed-required, 8 rooms + 2 chairs scores 29.3
and 2 rooms + 8 chairs scores 39.3. A chair-heavy footprint is what the exclusion list punishes.

**Say this whenever the score comes up:** Blake proposed bed-first for privacy, thoroughness
behind a door, and fewer handoffs. *None of that is in the model.* It prices what the rule costs
in minutes. Do not let the lab read as a verdict on his argument — the page says so in three
places and that framing should survive into the room.

### How it got here

1. **A pre-release bug sweep** (`b85a4ab`). No doctype (quirks mode) and no viewport meta, so
   every mobile breakpoint was dead code and phones got the desktop grid scaled down. A malformed
   `#` link threw before any handler was wired and killed the page. Board rows could load as a
   different lane than was ranked. Both backends silently dropped fields.
2. **"The Blake"** (`8453778`) — a third mode, `bedfirst`. Not a preset: a routing *rule* neither
   existing mode could express. Room by default, chairs as overflow, some patients cannot use a
   chair at all, nobody moved once placed (his anti-churn point).
3. **The exclusion list** (`dc029d9`) — his point is that the MD group signs off an *explicit*
   list, so it became a tickable panel plus a residual slider, not a hidden number.
4. **Four scope corrections from Ted**, each of which changed the model, not just the wording
   (`dda7ffd`, `a03ba12`, `dc75524`, `0899983`).

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

## Next actions

Nothing is blocked on code. Everything below is blocked on a person, so the useful move is
usually to help Ted get one of these unstuck rather than to start editing.

| # | action | owner | why it matters |
|---|---|---|---|
| 1 | ~~Re-push the Apps Script deployment~~ **DONE 2026-08-22 — Version 7** | — | The project's `Code.gs` was **stale**, so a redeploy alone would have been a no-op: its `HEAD` lacked `bedcc`/`bedExtra` and its `modes` lacked `bedfirst`. The repo's `shared-board.gs` was pasted in, saved, and the EXISTING deployment moved to a new version — same Deployment ID `…6fwLWXM6auKC`, so the address baked into the page is unchanged. Verified live: a Blake lane now saves with `mode: bedfirst`, `bedcc: 2.9.20`, `bedExtra: 0`, and loads back identically. |
| 2 | ~~Open the live page and check the leaderboard footer~~ **DONE 2026-08-22** | — | Verified in Chrome on Ted's laptop: footer reads *"shared board — everyone using this link sees the same list"*, `SHARED === true`, the baked `DEFAULT_BOARD` answers, and the live page serves the bed-first build. Closes open threads 4 and 6. |
| 3 | ~~Ask the extract for GU complaint rows + preferred-language~~ **NOT NEEDED — DONE 2026-08-22** | — | Both were already in `quality_deid.db`; `language` has been carried since 2026-08-15. Now measured and shipped. See open threads 2 and 3. |
| 4 | **Get the residual share from Blake** | Blake | Still 0%, but a smaller question than it was: the two shares that could be measured have been, so it now covers only a sensitive history and a family who needs a door. |
| ~~5~~ | ~~Decide whether Dysuria stays on the exclusion list~~ **DECIDED 2026-08-22: OFF** | — | It was Blake's sensitive-exam entry, and the physicians withdrew that rationale when they put urinary complaints outside the genital group. Removed from the ticked default; still tickable if the group wants it back on other grounds. Bed-required goes 9% → 8% of the lane. |

Ted has been distributing the link to physicians, so **regressions are now user-visible**. Rebuild
and run all three checks before any push, and prefer a browser check for anything touching layout.

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

**Settled 2026-08-22 — both of these were NOT missing data**

2. ~~GU complaints must be broken out of the 227-complaint bucket~~ **DONE, and the grouping is
   narrower than "GU".** They were always in `quality_deid.db`; nothing needed to be asked of the
   extract. The refresh now emits a **genital group** — 18 normalised complaints, 0.87% of the
   lane — carrying a stable key `k:"genital"` so the exclusion list matches on that and never on
   the display name, which holds a member count that moves with the data.
   ⚠ **Urinary complaints are deliberately OUT of it** (physicians, 2026-08-22): dysuria,
   hematuria, urinary frequency and retention — 205 visits, 1.30% — do not usually need a
   sensitive exam, which is the entire reason the group exists. Dysuria remains ticked on its own
   as Blake wrote it. Do not "complete" the group by folding urinary back in.
3. ~~Preferred language / interpreter need is not in the extract~~ **IT IS, since 2026-08-15** —
   the mbed de-id build began carrying `language` (rare values bucketed at n<20) a week after this
   thread was written. Measured on the window: **11.4% need an interpreter**, 99.7% coverage, 20
   languages. It ships as its own ticked criterion, **per complaint** (4.2% `Well Child` to 24.1%
   `Diarrhea`) — a flat rate would misprice any narrowed lane — applied only to whoever the ticked
   complaints leave behind, because those complaints are themselves more non-English than average
   (14.6% vs 11.1%) and composing on the window-wide figure would double-count.

   **What it did to the numbers.** Bed-required goes 8.2% → 19.2% of the lane, and The Blake at
   6 rooms + 4 chairs moves **29.15 → 29.39** — a quarter of a minute for a share that more than
   doubled. The rule is insensitive to the share when rooms are ample, and the sensitivity is all
   in the chair-heavy layouts: the same change costs +0.1 at 8 rooms, +1.3 at 4, **+4.2 at 2**.
   So "his rule is close to free, but only because it has rooms" now rests on a measured share
   rather than a flat 25% guess.

   The residual slider still ships at 0% and now stands for two genuinely uncodable reasons only —
   a sensitive history, and a family who needs a door. **Blake is still the source for it.**

**Never verified from a sandbox****Never verified from a sandbox** (the agent proxy denies both hosts, so these need Ted's laptop)

4. ~~The baked-in shared board has never been reached~~ **REACHED 2026-08-22.** `DEFAULT_BOARD`
   answers, `SHARED === true`, the footer reads *"shared board — everyone using this link sees the
   same list"*, and it returns the three existing rows. Physicians opening the plain link share one
   board.
5. ~~The Apps Script deployment still needs a new version pushed~~ **RESOLVED 2026-08-22, and the
   cause was one layer deeper than expected: the Apps Script project's own `Code.gs` was stale, not
   just its deployment. Nobody had ever pasted `shared-board.gs` in — no session could reach
   `script.google.com`. Redeploying without pasting would have shipped the same rejection and looked
   like a fix.** Kept below because the failure signature is worth recognising: (Deploy → Manage deployments →
   New version) — and the failure is not the one this file predicted. Measured against the live
   endpoint: a `bedfirst` row comes back `{"error":"bad entry"}` and is **rejected entirely**, with
   or without `bedcc`/`bedExtra`. The cause is `shared-board.gs:87` — `modes` gained `'bedfirst'`
   in this repo, and the deployment predates it. A rejected POST makes `pushShared` return false,
   which sets `SHARED=false` and flips the footer to *"shared board unreachable"* for the rest of
   that visit, so a physician saving a Blake lane loses it from the group's board and gets no error
   they would recognise. Nothing was written by the test — every attempt was refused, so the board
   still holds only Ted's three `test*` rows.
6. ~~The live page has only ever been verified from the built file~~ **VERIFIED IN A BROWSER
   2026-08-22.** It serves the bed-first build: three modes including *Rooms first, chairs only when
   rooms are full*, five presets including **The Blake**, and `bedcc`/`bedExtra` present in the
   shipped bytes.
7. **The engine-validation table** in `README.md` compares against a model that is not in this
   repo. It is labelled as a port-time record for that reason; do not "refresh" those numbers.
