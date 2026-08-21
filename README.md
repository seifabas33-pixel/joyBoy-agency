# Joy Boy Agency

Client-facing decks and dashboards for Joy Boy Agency — entertainment and
animation management for Red Sea resorts.

## Contents

| File | What it is |
| --- | --- |
| `anjum-dashboard.html` | Pitch dashboard for the SUNRISE Anjum Resort meeting, 22 Aug 2026 |

## Live

**https://seifabas33-pixel.github.io/joyBoy-agency/**

Published by GitHub Pages from `main` via `.github/workflows/pages.yml`, which
copies `anjum-dashboard.html` to the site root as `index.html`. Any push to
`main` that touches the dashboard redeploys it automatically.

The page carries a `noindex` tag, so the link works for anyone it is sent to
but does not surface in search results.

> **This repository is public.** Treat everything committed here as readable by
> anyone, including the hotels being pitched. Do not commit contracts, crew
> personal details, or Joy Boy's internal figures.

## anjum-dashboard.html

A self-contained single-page dashboard. Open it in any browser — no build step,
no dependencies. It follows the viewer's light/dark setting and has a manual
theme toggle, and it prints cleanly if paper copies are needed.

**Argument:** Anjum is already at 4.9 on TripAdvisor, so the rating has no
meaningful upside left — only downside. Entertainment is the most-mentioned
subject in its recent reviews and the named cause of two of its three most
recent non-five-star reviews, which makes the entertainment department the
place that score is defended. Joy Boy runs that department.

**Sources**

- TripAdvisor data for SUNRISE Anjum Resort and a 17-property Marsa Alam
  comparison set, pulled 21 Aug 2026.
- Joy Boy operating records: attendance registers, shows calendars and payroll
  control sheet for True Beach Resort (Jul – Aug 2026) and Casa Blue Beach
  Resort (2024). These two resorts are Joy Boy's complete client record and
  nothing on the page draws on any other engagement.

**Deliberately not on the page:** Joy Boy's internal commercial figures. The
dashboard makes the operating-discipline case without disclosing the agency's
own numbers to a prospect. Keep it that way.

**Logo:** the masthead carries the Joy Boy emblem, embedded as a base64 data
URI so the page stays self-contained. Only the circular emblem is used — the
supplied artwork's wordmark reads "Entertainmarnt", so the trading name —
Joy Boy Agency — is set in the page's own typeface instead. Swap in the full
lockup once the artwork is corrected.

**Before presenting** — one thing is still a placeholder: the commercial terms.
The dashed panel at the end of the "What we are asking for" section lists
exactly which figures are needed.
