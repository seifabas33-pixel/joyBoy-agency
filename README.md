# Joy Boy Agency

Client-facing decks and dashboards for Joy Boy Agency — entertainment and
animation management for Red Sea resorts.

## Contents

| File | What it is |
| --- | --- |
| `anjum-dashboard.html` | Pitch dashboard for the SUNRISE Anjum Resort meeting, 22 Aug 2026 |

## anjum-dashboard.html

A self-contained single-page dashboard. Open it in any browser — no build step,
no dependencies. It follows the viewer's light/dark setting and has a manual
theme toggle. It also prints cleanly if you need paper copies.

**Argument:** Anjum is already at 4.9 on TripAdvisor, so the rating has no
meaningful upside left — only downside. Entertainment is the most-mentioned
subject in its recent reviews and the named cause of two of its three most
recent non-five-star reviews, which makes the entertainment department the
place that score is defended. Joy Boy runs that department.

**Sources**

- TripAdvisor data for SUNRISE Anjum Resort and a 17-property Marsa Alam
  comparison set, pulled 21 Aug 2026.
- Joy Boy operating records: attendance registers, shows calendars, payroll
  control sheet and ancillary cash-flow ledger for True Beach Resort
  (Jul – Aug 2026) and Casa Blue Beach Resort (2024). These two resorts are
  Joy Boy's complete client record and nothing on the page draws on any other
  engagement.

**Before presenting** — two things are still placeholders:

1. The logo lockup top-left renders a `JB` monogram. Replace it with the real
   mark: swap the `<div class="logoslot">JB</div>` for an `<img>`, or set the
   logo as its `background-image` via a data URI so the page stays
   self-contained.
2. The commercial terms are not filled in. The dashed panel at the end of the
   "What we are asking for" section lists exactly which figures to take from
   the last True Beach proposal.
