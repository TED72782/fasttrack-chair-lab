# Fast Track Chair Lab

An interactive simulator for the Mary Bridge Children's emergency department fast-track lane.

**→ [Open the lab](https://ted72782.github.io/fasttrack-chair-lab/)**

Set the lane up however you like — how the spaces are arranged, how many there are, how long
each one is tied up — and see what the evening does. Every change re-simulates 2,400 evenings
in your browser. One rule: **no hour over 15 minutes at the door.**

## The three layouts

| | |
|---|---|
| **8 rooms + results chairs** | Assessment happens in a room, then the patient moves to a chair to wait for results. |
| **Chairs, patient stays put** | One group of chairs. Status changes from assessment to results-waiting in place; nobody moves. |
| **Chairs, divided** | Some chairs for assessment, the rest for results-waiting. |

Four evenings to hold, all measured: a typical one (26 patients), a busy one (31), the busiest
in ten (36), and a bad one (40).

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
  one hour, which is why the target here is the worst hour rather than the average.
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
