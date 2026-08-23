# Joy Boy Agency

Client-facing decks and proposals for Joy Boy Agency — entertainment and
animation management for Red Sea resorts.

## Contents

| File | What it is |
| --- | --- |
| `anjum-dashboard.html` | Pitch dashboard for the SUNRISE Anjum Resort meeting, 22 Aug 2026 |
| `anjum-proposal.html` | The Anjum proposal as sent — kept as the record, no longer deployed |
| `proposal-template.html` | Reusable proposal template for the next hotel |
| `media/` | Show reels and clips (MP4), embedded by the proposals |

## Live

- Dashboard: **https://seifabas33-pixel.github.io/joyBoy-agency/**
- ~~Proposal~~ — deactivated. The old `/proposal.html` link now returns 404.
  The Anjum PDF remains valid wherever it was already sent.

Published by GitHub Pages from `main` via `.github/workflows/pages.yml`.
Any push to `main` that touches the dashboard redeploys automatically.

## Making a proposal for a new hotel

`proposal-template.html` is the finished Anjum proposal with the
hotel-specific text replaced by tokens. To produce a new one, copy it to
`<hotel>-proposal.html`, replace the tokens, and (if it should go live) add a
copy line for it in `.github/workflows/pages.yml`:

| Token | Example |
| --- | --- |
| `[[HOTEL_NAME]]` | SUNRISE Anjum Resort |
| `[[HOTEL_SHORT_NAME]]` | Anjum |
| `[[HOTEL_LOCATION]]` | Ras Dory · Marsa Alam |
| `[[MONTH_YEAR]]` | August 2026 |

Everything else in the template is Joy Boy stock: the agency section, the
Casa Blue awards grid, the five reels and the gallery, the standard price
list (locked, non-editable), the budget call-out and the contact block.
Review the price list per hotel before sending — the rates in the template
are the Anjum quote.

The easiest path: tell Claude the four token values and any price changes,
and it generates, deploys and PDFs the new proposal.

## anjum-dashboard.html

Anjum-specific pitch dashboard: TripAdvisor/HolidayCheck/Booking evidence,
the seven guest-named gaps, Joy Boy's operating record, and the 90-day plan.
Carries a `noindex` tag, as do the proposals.

**Deliberately not in this repository:** Joy Boy's internal figures —
payroll, ancillary revenue, margins. The pages make the operating-discipline
case without them.

> **This repository is public.** Treat everything committed here as readable
> by anyone, including the hotels being pitched. Do not commit contracts,
> crew personal details, or Joy Boy's internal figures.
