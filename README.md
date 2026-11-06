# isokit

isokit is a Claude Code skill that draws animated isometric product illustrations. You describe a product story in a prompt. Claude storyboards it into a few beats and draws it as plain SVG with CSS/WAAPI motion: rounded slabs, wires with light pulses, labels, and a loop that returns to its first frame. Scenes need no animation library. They pause when off screen and show a still frame for reduced motion.

Showcase: https://ga-mo.github.io/isokit/

The repo has two parts:

- `skill/` is the skill. Point `~/.claude/skills/iso` at it and Claude Code can use it.
- `site/` is the showcase website. It renders every example in `skill/examples/` at build time, each into its own file that the page mounts when it scrolls near.

## Install

You need [Bun](https://bun.sh) and Claude Code.

```sh
git clone https://github.com/GA-MO/isokit.git
mkdir -p ~/.claude/skills
ln -s "$PWD/isokit/skill" ~/.claude/skills/iso
cd isokit/skill/scripts && bun install
```

If `~/.claude/skills/iso` already exists, move it away first (`mv ~/.claude/skills/iso ~/.claude/skills/iso.old`); otherwise `ln -s` puts the link inside it.

`bun install` adds the screenshot and type-check tools the skill uses to check its own work. Screenshots use your installed Google Chrome. Run `bunx playwright install webkit` too if you also want iPhone Safari frames.

## Use

Ask Claude Code for a scene in plain words, for example:

> Draw one event fanning out to email, push and SMS, each channel lighting up as it receives it.

The skill reads `skill/SKILL.md` and `skill/recipes.md`, writes a scene module, renders it with `skill/scripts/render.ts`, takes screenshots at phone and desktop widths, and fixes what looks off. Each card on the showcase site shows a prompt for its scene.

To render an example yourself:

```sh
cd skill
bun scripts/render.ts examples/notifications.ts out/notifications.html
node scripts/shots.mjs page=out/notifications.html times=0,1,2 loop=1 widths=393,1280 out=out/shots
```

To use scenes in your own site, import `Scene` and `responsive` from `skill/lib/iso.ts` at build time and call `mountAll()` from `skill/lib/runtime.ts` in the browser. `skill/SKILL.md` section 6 shows the Astro setup that `site/` uses.

## What is in `skill/examples/`

There are 39 scenes for fictional products at four levels, in four categories (the showcase tabs: Product, Security, Infra, Data & AI). Every tab has at least one scene at every level.

- Spot: small one- or two-object scenes for feature lists, empty states and loaders: a lock, a sync loop, a filling inbox, a charging battery, a bell, a table scan, a tile loader and an empty box.
- Simple: CI/CD, notifications, file upload, database branching, a service map you can hover, an audit ledger, DNS resolution and cron jobs.
- Medium: auth, ETL, queue and workers, search index, a feature flag rollout you can play, key rotation, a firewall, zero-trust access, a workload scheduler, autoscaling, health checks, a blue-green release, a snapshot restore, embedding clusters, a training loss curve, a re-ranking shelf and an A/B test.
- Complex: an AI agent calling tools, payments, edge cache, observability, a data erasure request and a retrieval-backed answer.

There are also the hero scene and 15 side finishes in `materials.ts`. Slab sides use the `paints` in `shared.ts` (gradient, brushed metal, stripes, dots, glass, a seeded random mosaic and flat colour).

## Numbers

All numbers were measured on 2026-11-06.

| What | Raw | Gzip |
|---|---|---|
| Showcase `index.html` (the hero inline, 40 empty scene boxes) | 588.9 kB | 45.0 kB |
| Showcase CSS | 23.4 kB | 5.4 kB |
| Showcase JS bundle (scene runtime and lazy mounting) | 5.1 kB | 2.0 kB |
| Showcase inline JS (copy buttons, filter and the flag demo) | 4.2 kB | 1.7 kB |
| All 72 scene files in `site/dist/scenes/` (compact and wide copies) | 8310.1 kB | 648.0 kB |
| Largest scene file (`embed-lg.html`) | 389.6 kB | 21.7 kB |
| Scene runtime alone (`skill/lib/entry.ts`) | 3.3 kB | 1.4 kB |

The page does not grow with the number of scenes. Each card holds an empty box. When the box comes within 75 % of a screen height of the viewport, the page fetches only the copy that fits the box, compact or wide, and mounts it. A visitor who scrolls the whole page loads one file per box (40), not all 72. Before this change the page shipped every copy inline: 208.6 kB gzip for 16 scenes.

How they were measured:

- Showcase rows: `bun run build && bun run size` at the repo root. `site/scripts/size.ts` gzips each file in `site/dist` at level 9, sums the inline module scripts and the scene files.
- Runtime row: `bun build skill/lib/entry.ts --minify --target browser > out.js`, then `wc -c < out.js` for raw and `gzip -9 -c out.js | wc -c` for gzip. All rows use 1 kB = 1024 bytes.

Fonts are not counted. The site self-hosts Inter and Fira Code as `woff2`.

## Develop

```sh
bun install          # at the repo root (installs site/)
bun run dev          # showcase dev server
bun run build        # static build into site/dist, served under /isokit/
bun run test         # kit and example tests
```

Pushing to `main` deploys the site to GitHub Pages through `.github/workflows/pages.yml`. Set the repository's Pages source to GitHub Actions (Settings, Pages) once before the first deploy.

## License

MIT. See [LICENSE](LICENSE).
