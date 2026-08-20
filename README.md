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
instead: today's wait for a room in the main department, by hour — 31 minutes at 15:00 rising to
101 at 22:00.

**54.6 minutes is the number to beat** — what these patients wait today, averaged over the
evening. Accept nobody and you score exactly that. There is no way to win by shrinking:

| lane | takes | wait among those it accepts | score |
|---|---|---|---|
| 9 chairs pooled | 31 of 31 | 9.7 | **12.9** |
| 10 spaces, 6+4 | 31 of 31 | 18.3 | **23.3** |
| 10 spaces, 6+4, rarely-test complaints only | 6 of 31 | 0.0 | 43.8 |
| 6 spaces, 4+2, test rate ≤ 50% | 8 of 31 | 1.7 | 40.3 |
| 6 spaces, 4+2, everyone | 31 of 31 | 79.3 | **103.6** |
| no lane at all | — | — | 54.6 |

Two rows there are worth sitting with. A lane taking only the easy complaints scores *worse*
than one taking everybody, because the patients it turns down still wait. And six spaces taking
all comers scores worse than having no lane, because its own queue is longer than the main
department's.

It assumes the main department's wait is unaffected by the lane. Taking work out of it should
make that wait shorter, so if anything this understates what excluding patients costs.

By default the board is saved in your own browser, so it is per-device. Use **Copy link to this
setup** to paste a configuration to someone else — the whole lane is in the URL.

### One shared board, from anywhere

Deploy `shared-board.gs` as a Google Apps Script web app — six steps in
[SETUP-SHARED-BOARD.md](SETUP-SHARED-BOARD.md), about three minutes, one person only. Paste the
URL it gives you into **Shared board** at the foot of the leaderboard.

After that, **Copy link to this setup** produces a link that carries the board with it. Send that
link round and everyone else is joined automatically with nothing to configure. The board is a
Google Sheet, one row per lane, so you can sort it or paste it into a slide.

### One shared board, for a meeting

Run `python3 serve_board.py` on one machine and share the address it prints. Everyone on the
same network opens that instead of the GitHub link, and all entries land on one list.

    python3 serve_board.py            # prints http://<your-ip>:8000/

It serves the page **and** the board from the same place, and that is deliberate: this site is
HTTPS, and a browser will not let an HTTPS page call an `http://` endpoint on a laptop. Same
origin sidesteps that with no tunnel and nothing exposed to the internet — it listens on the
local network only, and stops when you stop it. The board lives in `board.json` beside the
script; delete it to reset.

The page detects the shared board automatically and says so under the table. If the machine
running it goes away mid-session, the page quietly falls back to per-browser storage rather
than breaking.

## The three layouts

| | |
|---|---|
| **8 rooms + results chairs** | Assessment happens in a room, then the patient moves to a chair to wait for results. |
| **Chairs, patient stays put** | One group of chairs. Status changes from assessment to results-waiting in place; nobody moves. |
| **Chairs, divided** | Some chairs for assessment, the rest for results-waiting. |

Four evenings to hold, all measured: a typical one (26 patients), a busy one (31), the busiest
in ten (36), and a bad one (40).

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
