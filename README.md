# Fast Track Chair Lab

An interactive simulator for the Mary Bridge Children's emergency department fast-track lane.

**→ [Open the lab](https://ted72782.github.io/fasttrack-chair-lab/)**

Build a lane, run the evening, put it on the board. Every change re-simulates 1,200 evenings in
your browser. There is no pass mark — the page reports **how long people wait and how many get
turned away**, and what counts as acceptable is yours to argue about.

## The score

**Minutes of delay per ESI 4/5 patient arriving in the window — whoever ends up treating them.**

Every other number improves if the lane takes fewer patients. Narrow the criteria, or let the
queue spill past closing, and the average among those you served looks better while the evening
is unchanged. So the score charges the patients a lane does *not* serve what they actually get
instead — today's wait for a room, by the hour they arrived in.

Accept nobody and you score exactly the bar. There is no way to win by shrinking.

### What the bar is

**Today.** An ESI 4/5 patient arriving in this window waits 50.0 minutes on average now, by the
hour they arrive — best at 07:00 (16 min), worst at 23:00 (109).

Today already has a fast track: the **Orca pod**, whose hours are plainly visible in the data —
0–1% of ESI 4/5 overnight, 65–68% from 11:00 to 18:00, 40% by 21:00, 7% by 23:00. So the wait
curve's shape is largely that pod opening and closing. Its patients wait a flat 31–45 minutes at
every hour; everyone else climbs from 31 to 118.

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

Busy evening (31 arrivals), scored against today's arrangement:

| lane | takes | wait among those it accepts | score |
|---|---|---|---|
| 9 chairs pooled, everyone | 31 of 31 | 17.7 | **20.9** |
| 10 spaces, 6+4, everyone | 31 of 31 | 26.3 | **31.2** |
| 10 spaces, 6+4, low-test complaints only | 6 of 31 | 8.0 | 48.2 |
| 6 spaces, 4+2, low-test complaints only | 6 of 31 | 8.5 | 48.3 |
| *today's arrangement* | — | — | *58.1* |
| 6 spaces, 4+2, everyone | 31 of 31 | 87.3 | **110.8** |

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

## Choosing who the lane accepts

The **Who the lane accepts** panel turns each chief complaint on or off. Selecting changes three
things at once, and the third is the one people miss:

1. **how many patients the lane sees** — the selected share of the evening
2. **how often a test is needed** — Ear Problem 10%, Eye Problem 9%, Laceration 12% against
   Ankle Injury 99%, Dysuria 98%, Finger Injury 83%
3. **how long a space is held** — each complaint's own measured means

Complaints come from triage as free text and are grouped by the repo's shared normaliser, so
*Febrile* and *Fever* are one complaint rather than two. The 24 commonest are listed
individually and the remaining 227 are aggregated into one bucket rather than dropped.

**Narrowing the criteria is not free, and the score does not price it.** The score counts the
patients the lane accepts, so taking only the complaints that never need a test looks superb —
while the rest of the evening still arrives and goes to the main department. The board shows
what share of the evening you took next to the score for exactly that reason. What happens to
the patients you exclude is not modelled here.

## Where the numbers come from

The arrival pattern across 15:00–23:00, how long patients occupy a space, and the ~50% who need
a lab or an image are all measured from Mary Bridge ESI 4/5 encounters, 2025 onward. The
simulation is an event-driven queue model — patients arrive at random times, take a space if one
is free, and queue if not. It is the same engine that produced the figures in the scoping deck,
ported to JavaScript and checked against it line by line:

| layout | in this page | in the original model |
|---|---|---|
| 6 + 4 divided | 9.42 min | 9.49 min |
| 7 + 3 divided | 7.00 min | 6.91 min |
| 8 rooms + 10 chairs | 1.23 min | 1.27 min |
| 10 chairs pooled | 2.50 min | 2.64 min |

## The lane closes at 23:00

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
  chair suits a particular child, and what happens to people still in chairs at 23:00 are all
  real considerations and none of them are in the model. If pooling wins on this screen and
  loses on the ward, the ward is right.

## Privacy

No patient-level data. The page embeds aggregate distributions only — quantiles of service
times, an hourly arrival profile, and a list of nightly totals. Nothing identifies a person and
no record-level data leaves the source system.

## Running it

`index.html` is self-contained: open it in any browser, no server and no build step. The only
external request is to Google Fonts.
