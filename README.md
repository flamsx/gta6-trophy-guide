# Leonida 55 — GTA VI Trophy Guide & Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/flamsx/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/flamsx/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline, open-source web app that is the best guide and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI. Built for the make.fun bounty [gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01).

## What it does

- **Checklist of all 55 official trophies** with their official name, description and grade (1 Platinum, 2 Gold, 6 Silver, 46 Bronze, 28 hidden), saved in the browser with export and import.
- **Filters** by grade and kind (story, side mission, collectible, activity, robbery, world, money), plus search and an earned filter.
- **Spoiler setting** that hides story trophies until they are earned.
- **Guide pane** for every trophy: a full guide in our own words, its sources, its missable note and its PSN progress target with a counter.
- **Platinum roadmap** in seven stages, in order, with progress per stage.
- **Missables watch list**: the one confirmed missable moment (Positive Mental Attitude, Chapter 1 balcony meditation) plus the honest note that no reliable missable list exists yet.
- **Next up planner**: suggests the next trophies from your current progress — the missable watch first, then the next story trophy, your closest counters and quick wins.
- **Audit strip**: 55/55 official names verified against Exophase (2026-11-18) + PSNProfiles.

## Sources & honesty

- Official list: Exophase (`exophase.com/game/grand-theft-auto-vi-psn/trophies/`) and PSNProfiles (`psnprofiles.com/trophies/43531-grand-theft-auto-vi`), frozen 2026-11-18. Hidden flags cross-checked with planetgta6.com and outputlag.com.
- Every guide is written in our own words from the official descriptions. A method that names another guide cites it, and anything not yet checked in the game says so.
- No Rockstar logo or artwork is used anywhere. Unofficial fan-made tracker, not affiliated with or endorsed by Rockstar Games.

## Run it offline

```sh
node serve.ts
# open http://localhost:8080
```

`app/` is plain static files: `index.html`, `css/style.css`, `js/` (ES modules, no build step) and `app/data/trophies.json`. It makes zero network requests.

## Build the entry

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` validates the trophy data (55 names, grade mix 1/2/6/46, 28 hidden, every guide non-blank) and the screenshots (3–4 files, each ≤ 256 KiB), copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.

Screenshots (`screenshots/`, 1280×800 JPEG) are taken with `shots.py` (Playwright + Chrome-for-Testing) from the app served by `serve.ts`, with progress seeded at 13 of 55 earned.

## License

MIT — see `LICENSE`.
