# Fast Track Chair Lab

An interactive simulator for the Mary Bridge Children's emergency department fast-track lane.

**→ [Open the lab](https://ted72782.github.io/ft-lab/)**

Build a lane, run the evening, put it on the board. Every change re-simulates thousands of
evenings in your browser. There is no pass mark — the page reports **how long people wait and how
many get turned away**, and what counts as acceptable is yours to argue about.

## The score

**Minutes of delay per ESI 4/5 patient arriving that day — whoever ends up treating them.**

The denominator is the whole day, not the lane's hours. A patient who arrives at 09:00 while the
lane is shut is not served by it, exactly as a patient its criteria exclude is not served by it,
and both are charged what they actually get instead. Scoring only the hours a lane chose to open
would reward a lane open for one quiet hour.

Every other number improves if the lane takes fewer patients. Narrow the criteria, or let the
queue spill past closing, and the average among those you served looks better while the evening
is unchanged. So the score charges the patients a lane does *not* serve what they actually get
instead — today's wait for a room, by the hour they arrived in.

Accept nobody and you score exactly the bar. There is no way to win by shrinking.

### What the bar is

**Today.** What an ESI 4/5 patient waits now, by the hour they arrive — lowest in the early
morning, highest late in the evening.

The bar is the figure **across the whole day**, not across the lane's hours. Those are two
different numbers and the evening one is the larger, because the evening is the worse part of the
day; a lane compared against the evening alone would be flattered by the comparison. The page
prices every ESI 4/5 patient of the day, quiet daytime hours included, so it compares against the
day.

Today already has a fast track: the **Orca pod**, whose hours are plainly visible in the data —
near-zero overnight, the majority of ESI 4/5 through the middle of the day, winding down by late
evening. So the wait curve's shape is largely that pod opening and closing: its patients wait a
flat band at every hour while everyone else climbs steeply.

The page carries the current figures for all of this, refreshed from the department database —
they are deliberately not restated here, because this file is not refreshed with them.

**There is no "no fast track" comparison, and there cannot be one.** The department has run a
fast track throughout the measured period, so no lane-free day exists. This page briefly offered
such a bar, built by excluding the patients who went through the pod. It was withdrawn:

- **59% of the walkouts in those hours have no care area recorded at all.** Someone who leaves
  before being placed can never be labelled Orca, so every walkout fell into the "no fast track"
  group by bookkeeping rather than by outcome. Removing walkouts closed most of the gap —
  59.2 → 52.7, against 46.0 for everyone.
- What remained was not a counterfactual either: it was the patients the pod did **not** take
  while it was open, i.e. its overflow, concentrated at the moments it was full.

Today's arrangement is the honest bar. It is what actually happens now, which is the thing any
change has to beat.

### Where that leaves the layouts

One run on the 2026-08-12 cut, at the page's own defaults: a busy day, the lane open 15:00–23:00,
assessment ending at 44 minutes, a no-test patient keeping the space. Set those and the page
reproduces it. **The ordering is the finding; the figures move with every data cut** — an earlier
version of this table was a whole scoring rewrite out of date and had the last row at 110.8.

| lane | takes | min per patient arriving into the lane | score |
|---|---|---|---|
| 9 chairs pooled, everyone | 31 of 31 | 17.5 | **31.5** |
| 10 spaces, 6+4, everyone | 31 of 31 | 27.5 | **36.8** |
| 10 spaces, 6+4, low-test complaints only | 6 of 31 | 8.0 | 45.1 |
| 6 spaces, 4+2, low-test complaints only | 6 of 31 | 8.5 | 45.1 |
| *today's arrangement* | — | — | *50.0* |
| 6 spaces, 4+2, everyone | 31 of 31 | 96.2 | **80.8** |

The middle column counts every patient who arrives into the lane's stream, including the ones it
later sends to the main department at closing — the same figure the page's second card reports.
It is not the wait among the lucky ones.

Every wait here starts at the door. A patient cannot be put anywhere until they are registered
and triaged, which takes 8.0 minutes on average and barely moves across the evening, so a lane
with a chair standing free still reports 8 — not zero. The figure it is compared against contains
the same 8 minutes.

**Whether narrowing helps depends on the footprint, not on a rule.** At ten spaces, taking
everyone beats taking only the easy complaints — the patients you turn down still wait. At six
it reverses, because six cannot absorb them. Neither result carries across.

**Six spaces taking all comers scores worse than changing nothing**, because its own queue is
longer than the department's. That holds under every partial-diversion assumption tested; it only
reverses if the lane is shed the moment it backs up, so it is a statement about a queue allowed
to build, not about six spaces as such.

It assumes the main department's wait is unaffected by the lane. Taking work out of it should
make that shorter, so if anything this understates what excluding patients costs.

## The three layouts

| | |
|---|---|
| **Assessment spaces + a second area** | Assessed in one space, then moved to a second area to wait for a result **or to be discharged**. |
| **One group, patient stays put** | A patient takes a space on arrival and keeps it until they leave. Nobody moves. |
| **Rooms first, chairs only when rooms are full** | A room if one is free; a chair only once every room is taken. A share of patients cannot use a chair at all. Nobody moves. |

### The Blake

The third layout is Blake's proposal, and it is a rule rather than a shape: **a room is the
default, not a stage.** Chairs are the flex state, reached only when room capacity hits zero, and
a bed-required list of presentations never goes vertical at all — a full-body or sensitive-area
exam, a sensitive history, a family that needs a door. Nobody is moved once placed, which is the
point: the proposal is explicitly about not shuffling patients for the sake of process.

Two things to know before reading its score.

**Most of what it is for is not in the model.** Privacy, a more thorough evaluation behind a door,
and fewer handoffs and forgotten tasks are the reasons to do this, and the page prices none of
them. It measures what the rule *costs* in minutes, which is the question it can answer.

**The exclusion list is a list, and it is yours to sign off.** Blake's second point is that the
MD group establishes explicit chief-complaint exclusions, so the page carries them as a panel you
tick rather than a number: every complaint is there, three come pre-ticked (abdominal pain, rash,
dysuria — the ones he named that a chief complaint can carry), and the share the simulation uses
is computed from their measured volumes.

The other four reasons he gives — a sensitive history, a mental-health presentation, a
child-abuse evaluation, a family who needs a door — **are not chief complaints and never will
be**, so no amount of ticking finds them. They get a second control: *plus this share of everyone
else*. It starts at zero, which is certainly too low, and the page says so. Only the people doing
triage can put the real number on it.

Set the share to zero and this layout collapses exactly onto the pooled one over the same
estate — which is the sanity check, and also the honest statement of what the rule costs. On the
same ten spaces, the ordering runs: bed-first at the codable share ≈ pooled, both well ahead of
the 6+4 split. **The rule is close to free while there are enough rooms, and expensive when there
are not** — a chair-heavy footprint is what it punishes, because the patients who need a door are
queueing for a shrinking number of them.

**You set the assessment time** — how long a patient keeps an assessment space before moving on.
Measured today, a patient needing a test holds it 72 minutes, but that is the time to their first
*order*, not a decision anyone made. It is the number to argue about: it sets how fast the
assessment side turns over, and how much load lands in the second area.

### The split follows the assessment time

Once the second area holds everyone, the visit divides between the two sides in a ratio the
assessment time sets — and the best split simply tracks that ratio. At ten spaces:

| assessment ends at | best split | best score | 6+4 scores |
|---|---|---|---|
| 20 min | 2+8 | 30.4 | 63.5 |
| 45 min | 4+6 | 31.5 | 45.6 |
| 60 min | 5+5 | 32.3 | 39.0 |
| 90 min | 6+4 | 32.8 | 32.8 |

On a typical day, everyone accepted, the second area holding all of them — same caveat as
above, the walk of the optimum is the finding, not the figures. Two things worth
reading off that table. The optimum walks 2 → 3 → 4 → 5 → 6 as the assessment lengthens, exactly
in step with the share of the visit each side carries — so back-weighting is
the *arithmetic* of a short assessment, not a discovery about chairs. And **the achievable score
never leaves a three-minute band.** Matching the split to your assessment time is what matters;
which pair you land on barely does.

So the question to settle is *when an assessment is finished* — which nothing in the record marks
— not which split is right in the abstract.

### This does not overturn the 6+4 in the scoping deck

The deck's 6+4 was derived when the second area held **only** the patients needing a test. Under
those semantics it is the best split of ten (32.40, against 5+5 at 32.46 and 4+6 at 39.46). It
answered a different question and answered it correctly.

Comparing the two best cases: old semantics 32.40, new semantics 31.49 — the whole
re-specification is worth **0.9 minutes per patient**. An earlier version of this file said 6+4
was "15 minutes worse", which came from scoring the deck's split under a rule *and* an assessment
time it was never derived with.

### Whether a no-test patient can be moved depends on where there is room

- **6+4** — stays 32.4, moves **46.7**. Moving them is *worse*: they flood a second area that is
  already too small.
- **6+10** — stays 27.0, moves **25.6**. Moving them is better, because there is somewhere to go.

The two *signs* are what to carry away; both are stable across seed blocks, and both figures move
with the data.

## Choosing who the lane accepts

The **Who the lane accepts** panel turns each chief complaint on or off. Selecting changes three
things at once, and the third is the one people miss:

1. **how many patients the lane sees** — the selected share of everyone arriving in its hours
2. **how often a test is needed** — Ear Problem 10%, Eye Problem 9%, Laceration 12% against
   Ankle Injury 99%, Dysuria 98%, Finger Injury 83%
3. **how long a space is held** — each complaint's own measured means

Complaints come from triage as free text and are grouped by the repo's shared normaliser, so
*Febrile* and *Fever* are one complaint rather than two. The 24 commonest are listed
individually and the remaining 227 are aggregated into one bucket rather than dropped.

**Narrowing the criteria is not free, and the score is what prices it.** Every other number on
the page improves when the lane takes fewer patients: take only the complaints that never need a
test and the wait among those you served looks superb, while the rest of the day still arrives
and goes to the main department. The score is the one figure that follows them there — a patient
the criteria exclude is charged today's main-department wait for the hour they arrived, exactly
like a patient who arrives while the lane is shut. That is why a narrowed lane's score gets
*worse* even as its wait gets better, and why the board shows the share of the day you took
beside it.

What it does not price is what happens to those patients *in* the main department: the model
assumes that department's wait is unaffected by the lane. Taking work out of it should make that
wait shorter, so if anything this understates the cost of excluding people.

## Where the numbers come from

The hour-by-hour arrival pattern across the whole day, how long patients occupy a space, and the
~50% who need a lab or an image are all measured from Mary Bridge ESI 4/5 encounters, 2025
onward. The
simulation is an event-driven queue model — patients arrive at random times, take a space if one
is free, and queue if not. It is the same engine that produced the figures in the scoping deck,
ported to JavaScript and checked against it line by line:

| layout | in this page | in the original model |
|---|---|---|
| 6 + 4 divided | 9.42 min | 9.49 min |
| 7 + 3 divided | 7.00 min | 6.91 min |
| 8 rooms + 10 chairs | 1.23 min | 1.27 min |
| 10 chairs pooled | 2.50 min | 2.64 min |

That check was run when the port was made, on the data cut and the fixed 15:00–23:00 lane the
deck used. It is a record that the two engines agree, not a set of figures you can reproduce from
today's controls — the data has been recut and the scoring rewritten since.

## Choosing the hours

The lane used to be nailed to 15:00–23:00. It is now a **start hour and a length**, because where
you put the window turns out to matter more than how you split the chairs — and the two curves
disagree about where the need is. Arrivals peak at 19:00–20:00 with a second bump at 11:00;
today's wait peaks later still, 107 minutes at 22:00, and is lowest at 07:00 (16). A window over
the busiest *arrival* hours is not automatically the one that removes the most waiting. The chart
above the sliders shows the whole day with your hours picked out, so you can see which you are
buying.

Because the score's denominator is the whole day, opening longer is not free and closing early is
not free either: hours the lane is shut are charged at the main department's rate for exactly
those hours.

## The lane closes when you close it

Anyone still waiting for a space when the lane shuts goes to the main department, and the page
reports that count beside the wait. This matters more than it sounds. Without a close rule the
simulation quietly served its backlog in overtime: a six-space lane ran until **09:04 the next
morning** and spent 45% of its work outside its own hours. That inflated every wait and pinned
every layout's worst hour at 22:00 — which reads like a demand peak and is nothing of the kind,
since arrivals actually peak at 19:00. It was the overtime bucket.

Read the two numbers together. The wait only counts patients the lane actually saw, so a layout
that turns people away looks better on it than it is.

## What it does not know

- **One assumption, and it is visible.** How long someone keeps the assessment space after their
  test is ordered. Nothing in the record times it, so it assumes 25 minutes. It moves the
  divided layouts and does not touch the pooled one — you can see that by switching between them.
- **Waits are averages.** Most patients wait nothing. Half an evening's total delay can land in
  one hour, which is why the worst hour is reported separately from the average. Two layouts a
  minute or two apart are not reliably in that order — rerun them and they can swap.
- **It cannot see the floor.** Who is watching a patient waiting on a result, whether an open
  chair suits a particular child, and what happens to people still in chairs when the lane shuts
  are all real considerations and none of them are in the model. If pooling wins on this screen and
  loses on the ward, the ward is right.

## Privacy

No patient-level data. The page embeds aggregate distributions only — quantiles of service
times, an hourly arrival profile, and a list of nightly totals. Nothing identifies a person and
no record-level data leaves the source system.

The shared leaderboard is the one thing that leaves the browser, and it carries **a name you type
and a chair layout** — nothing clinical, nothing about a patient. Its address is not a
credential: it travels in every link anyone forwards, and anyone holding the link can read and
write the board. Do not put anything on it you would not send in an email.

## Running it

`index.html` is a build product — `python3 src/build.py` reassembles it from `src/`. To *use* it,
open it in any browser; there is nothing to install and no server to run.

Two external requests leave the page: **Google Fonts**, and the **shared leaderboard** endpoint
described in `SETUP-SHARED-BOARD.md`, which the page contacts on load so everyone opening the
same link sees one list. Opened straight off disk (`file://`) there is no shared board to reach,
so the page falls back to one saved in that browser alone. See **Privacy** for what the board
carries.

### Checks

```
python3 src/build.py        # rebuild index.html + the headless harness from src/
node src/shim.js            # replays the animation headlessly against the shipped bytes
node shared-board.test.js   # the Apps Script backend, against a fake Sheet
```
