# AstroBlox — Astrocade Analytics Dashboard

**Live dashboard → [ritaverse.github.io/Astro](https://ritaverse.github.io/Astro/)**

Analytics and intelligence for [Astrocade](https://astrocade.com) — the AI-powered social gaming platform.

---

## Pages

| URL | What's on it |
|---|---|
| [`/`](https://ritaverse.github.io/Astro/) | **Games & Community** — top games by plays, genre breakdown, creator leaderboard, engagement chart, sortable game table, Discord snapshot |
| [`/creation.html`](https://ritaverse.github.io/Astro/creation.html) | **Create Studio** — cumulative games created, creator personas, AI agent team, creation workflow, monetization funnel |

## How the data stays fresh

| Layer | Frequency | What updates |
|---|---|---|
| Scraper (`scripts/scrape.mjs`) | Every 2 days via GitHub Actions | `data/games.json` — per-game plays, likes, comments, remixes (measured from the live site payload) |
| Monthly analyst pass | Monthly | Genre classifications, platform KPIs (MAU, funding, Discord), new `data/platform.json` and `data/creation.json` fields |

## Data provenance

- **Measured** — plays, likes, comments, remixes are parsed directly from astrocade.com's embedded Next.js payload. These numbers are real.
- **Modeled** — the cumulative-games curve in Create Studio interpolates between two verified anchors (0 at Aug 2025 launch, 75K by May 2026) at ~1,000 games/week.
- **Illustrative** — creator persona shares and per-agent coverage percentages are analyst estimates from qualitative sources. Astrocade does not publish these breakdowns.
- **Genre** — analyst-assigned from game title (Astrocade publishes no genre field). New games default to Unclassified until the monthly pass.

## Repo layout

```
index.html          Games & Community dashboard
creation.html       Create Studio dashboard
data/
  games.json        Per-game metrics + genres (auto-refreshed every 2 days)
  platform.json     Platform KPIs — MAU, funding, Discord, etc.
  creation.json     Creation metrics — total games, agents, monetization
scripts/
  scrape.mjs        Scraper — fetches the live Astrocade homepage payload
.github/workflows/
  refresh.yml       Scraper schedule (every 2 days)
  pages.yml         GitHub Pages deployment (triggers on every push to main)
```

## Sources

- [astrocade.com](https://www.astrocade.com/) — live game data
- [Fortune — Series B announcement](https://fortune.com/2026/05/05/astrocade-raises-56-million-series-b-sequoia-video-games-platform-ali-amir-sadeghian/)
- [Astrocade blog — community](https://www.astrocade.com/blog/astrocade-community-fastest-most-engaged-discord)
- [Astrocade blog — Astrocade 2.0](https://www.astrocade.com/blog/astrocade-2-worlds-first-agentic-ai-game-creation-platform)
- [@PlayAstrocade on X](https://x.com/PlayAstrocade) — milestone announcements
