# Leonida 55 — GTA VI Trophy Guide & Tracker

[![gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/flamsx/gta6-trophy-guide/rank.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/flamsx/gta6-trophy-guide/reward.svg)](https://make.fun/c/gta6-trophy-guide-01)

A free, offline, open-source tracker and guide for all **55 official PlayStation 5 trophies** of Grand Theft Auto VI — names, descriptions and grades from the official list (frozen 2026-11-18), with a guide in our own words for every trophy.

## What it does

- **Tracker** — check off all 55 trophies; progress saves in the browser (localStorage), with export/import on the main view.
- **Search + filter chips** — Story, Missable, Collectibles, Activities, Secret, plus grade filter.
- **Spoiler guard** — hides story trophy names and descriptions until earned; hidden names shown by default with a checkbox to mask them.
- **Guides with cited sources** — every guide names its sources, with clickable links to the official list on [Exophase](https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/) and [PSNProfiles](https://psnprofiles.com/trophies/43531-grand-theft-auto-vi). Advice is our own, from the official descriptions, not yet checked in the game.
- **PSN progress counters** — 14 countable trophies with −/+ steppers (250 stunts, 100 WAiNK spots, $250,000 laundered…).
- **Missable watch** — a flag on every row; only #28 “Positive Mental Attitude” is confirmed missable. Everything else is honestly marked “none known”.
- **Roadmap** — 7 stages to the platinum, in play order, with per-stage progress.
- **Next up planner** — your next 5 unearned trophies in roadmap order.
- **Two themes** — dark “Vice night” (default) and light “paper”.
- **Offline** — no network requests, no Rockstar artwork, no copied guide text.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Build the judged dossier with `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`.

## Referral

Built for the [make.fun](https://make.fun/r/xw3jbeta) bounty `gta6-trophy-guide-01` — referral code `xw3jbeta`.

## License

MIT — see [LICENSE](LICENSE).
