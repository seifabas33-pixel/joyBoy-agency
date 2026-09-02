# Joy Boy Agency

Client-facing decks and proposals for Joy Boy Agency — entertainment and
animation management for Red Sea resorts.

## Contents

| File | What it is |
| --- | --- |
| `anjum-dashboard.html` | Pitch dashboard for the SUNRISE Anjum Resort meeting, 22 Aug 2026 |
| `anjum-proposal.html` | The Anjum proposal as sent — kept as the record, no longer deployed |
| `proposal-template.html` | Reusable proposal template for the next hotel |
| `portfolio.html` | The agency portfolio — no prices, sendable to any client |
| `media/` | Show reels, the hero showreel (MP4) and `media/img/` — photos, posters, logo, favicons, social image |
| `legal.html`, `404.html`, `robots.txt`, `sitemap.xml` | Privacy & terms, custom not-found page, crawler files |
| `CLAUDE.md` | Project memory for Claude: deploy steps, hard rules, design direction, the 20-point launch checklist |

## Live

- Portfolio (homepage): **https://seifabas33-pixel.github.io/joyBoy-agency/**
- Anjum dashboard: **https://seifabas33-pixel.github.io/joyBoy-agency/anjum.html**
- `/portfolio.html` still works — it redirects to the homepage.
- Privacy & terms: **https://seifabas33-pixel.github.io/joyBoy-agency/legal.html**
- ~~Proposal~~ — deactivated. The old `/proposal.html` link now returns 404.
  The Anjum PDF remains valid wherever it was already sent.

The portfolio is the general-purpose piece for any prospect: the agency, the
Casa Blue awards, the reels and gallery, and the service catalogue with **no
prices** — it closes with "ask us for a tailored programme and budget", so
rates are only ever quoted per hotel in a proposal. Proposal requests go to
Mr. Moaz on WhatsApp. Sections: the agency, how we work (five-step timeline),
awards, what guests wrote (verbatim TripAdvisor reviews of True Beach Resort,
Aug 2026), the reels, the gallery and what we offer.
It has a dark and a light theme (sun/moon toggle),
a branded preloader, the showreel as the hero background with a fan of
photo cards spreading above the headline, a newspaper-style masthead for
the Our work section, a lightbox and custom play buttons on the reels; all images are files under
`media/img/` (the HTML itself is ~76 KB).

Published by GitHub Pages **from the `gh-pages` branch** (Settings → Pages →
Deploy from a branch). To update the live site, copy the changed files
(`index.html` = the portfolio, `anjum.html` = the dashboard, `media/` including `media/img/`)
onto `gh-pages` and push — GitHub
rebuilds the site automatically within a minute.

`.github/workflows/pages.yml` is the previous Actions-based deploy; it is
kept but currently inactive because Actions runs are blocked at the account
level (check https://github.com/settings/billing). Once Actions works again,
the Pages source can be switched back to "GitHub Actions".

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
