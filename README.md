<p align="center">
  <img src="docs/svg/hero.svg" alt="A one-line prompt types in, one box spins in and lands, and the system grows to 40 connected nodes with requests flowing through it" width="100%">
</p>

<h1 align="center">isokit</h1>

<p align="center"><b>Animated isometric explainers, drawn from a prompt.</b><br>
An Agent Skill that turns the story of your product into a looping isometric scene in plain SVG.<br>
<a href="https://ga-mo.github.io/isokit/">Live showcase</a> · <a href="#install">Install</a> · <a href="#use">Use</a> · <a href="#the-kit">The kit</a> · <a href="#numbers">Numbers</a></p>

You describe a product story. The `iso` skill storyboards it into three to six beats from measured motion recipes and draws it with a small kit: rounded slabs, wires that draw themselves, light pulses, text, and a loop that returns to its first frame. The scene is plain SVG with CSS and WAAPI motion. It needs no animation library, pauses off screen and shows a still frame for reduced motion. The image above is the showcase hero, exported by the kit as one SVG that animates with CSS alone, so it plays right here in the README.

## Gallery

Every image here is a real scene from `skill/examples/`, written by `exportSvg()` into `docs/svg/`. The [showcase](https://ga-mo.github.io/isokit/) plays all 39 scenes with their prompts.

<table>
  <tr>
    <td width="33%"><img src="docs/svg/battery-charge.svg" alt="Battery cells fill one by one" width="100%"></td>
    <td width="33%"><img src="docs/svg/sync-loop.svg" alt="Two arrows circle a tile while it syncs" width="100%"></td>
    <td width="33%"><img src="docs/svg/tile-loader.svg" alt="Nine tiles drop in a diagonal wave" width="100%"></td>
  </tr>
  <tr>
    <td><img src="docs/svg/inbox-fill.svg" alt="Letters stack in a glass tray" width="100%"></td>
    <td><img src="docs/svg/bell-ring.svg" alt="A bell rocks and rings spread" width="100%"></td>
    <td></td>
  </tr>
</table>

Every scene also ships a phone copy that tells the same story re-composed for a narrow screen. This is the hero's:

<p align="center"><img src="docs/svg/hero-phone.svg" alt="The hero re-composed for a phone" width="360"></p>

49 side finishes in six families. Generative finishes take a seed, and the same seed always draws the same pattern.

<p><img src="docs/svg/finish-metal.svg" alt="Metal finishes" width="100%"></p>
<p><img src="docs/svg/finish-glass.svg" alt="Glass finishes" width="100%"></p>
<p><img src="docs/svg/finish-natural.svg" alt="Natural finishes" width="100%"></p>
<p><img src="docs/svg/finish-tech-pattern.svg" alt="Tech pattern finishes" width="100%"></p>
<p><img src="docs/svg/finish-retro.svg" alt="Retro finishes" width="100%"></p>
<p><img src="docs/svg/finish-generative.svg" alt="Generative finishes" width="100%"></p>

## What you get

| Feature | What it does |
|---|---|
| A storyboard first | The skill writes the beats (what moves, when, how long) before it draws, from recipes measured frame by frame: arrivals, hand-offs, pulses, slot stacks, fills |
| Phone and desktop | Every scene ships a compact (390 wide) and a wide copy. They switch on the width of their own container, so a scene also works in a narrow column |
| No animation library | SVG, HTML text, CSS and WAAPI. The runtime is 1.4 kB gzip |
| Calm by default | Plays when scrolled into view, pauses off screen, shows a still that tells the whole story under reduced motion |
| Labels that never overflow | Text has a 13 px floor on phones, and `fitX()` keeps each label inside its scene at the narrowest width it will be shown |
| 49 side finishes | Metal, glass, natural, tech pattern, retro and seeded generative paints that bend round the slab's rounded corner as one line |
| `exportSvg()` | Writes a scene as one SVG animated with CSS `@keyframes` alone, no script, for READMEs, docs and email |
| `mountLazy()` | Mounts many scenes on one page as they scroll near the screen, fetching only the compact or wide copy that fits |
| Checks its own work | Render, screenshot at 393, 768, 1280 and 1440, strict types and a frame-time benchmark, all in `skill/scripts/` |

## Install

`iso` is an Agent Skill: the `skill/` folder with its `SKILL.md`. Every tool below needs it installed as a folder named `iso`. The skill's render and screenshot checks need [Bun](https://bun.sh) and your installed Google Chrome. Every path and command here comes from each tool's official docs, checked on 2026-11-06; the pages are listed in [docs/install-sources.md](docs/install-sources.md).

### Claude Code

```sh
git clone https://github.com/GA-MO/isokit.git
mkdir -p ~/.claude/skills
ln -s "$PWD/isokit/skill" ~/.claude/skills/iso
cd isokit/skill/scripts && bun install
```

If `~/.claude/skills/iso` already exists, move it away first, or the link lands inside it. Claude Code picks up the skill in a running session. If `~/.claude/skills` did not exist when the session started, run `/reload-skills`. Type `/iso`, or ask `What skills are available?`. For one repo only, copy the folder to `.claude/skills/iso` and commit it. Source: [Claude Code skills](https://code.claude.com/docs/en/skills).

### Claude app (claude.ai and the desktop app)

1. Turn on code execution: Settings > Capabilities > Code execution and file creation (called Create and edit files in the newer settings). On Team and Enterprise plans, an owner turns on Skills under Organization settings > Plugins & skills > Policy.
2. Build `iso.zip` with the `iso` folder at its top level. Every file `unzip -l` lists should start with `iso/`.

   ```sh
   git clone --depth 1 https://github.com/GA-MO/isokit.git
   cd isokit && git archive --format=zip --prefix=iso/ -o ../iso.zip HEAD:skill && cd ..
   unzip -l iso.zip
   ```

3. Open Customize > Skills, click `+`, then `+ Create skill`, then `Upload a skill`, and choose `iso.zip`.
4. Turn `iso` on in Customize > Skills. Then ask for an isometric flow and check that Claude's thinking shows it loading the skill.

Scripts run in Claude's code sandbox, so the Bun checks may not run there. Sources: [Using skills in Claude](https://support.claude.com/en/articles/12512180-using-skills-in-claude), [Create custom skills](https://claude.com/docs/skills/how-to).

### Codex (CLI, IDE extension, ChatGPT desktop app)

```sh
git clone --depth 1 https://github.com/GA-MO/isokit.git
mkdir -p ~/.agents/skills
cp -R isokit/skill ~/.agents/skills/iso
cd ~/.agents/skills/iso/scripts && bun install
```

Codex detects new skills on its own. Restart it if `iso` doesn't show. In the CLI or IDE extension, run `/skills` or type `$`. In the ChatGPT desktop app, open Skills in the sidebar. For one repo, use `.agents/skills/iso`. Source: [Codex skills](https://learn.chatgpt.com/docs/build-skills).

### Cursor

Use the same commands as Codex (`~/.agents/skills/iso`). Restart Cursor, then open Customize in the sidebar and go to Skills, or type `/` in Agent chat. For one repo, use `.agents/skills/iso` (or `.cursor/skills/iso`). Source: [Cursor skills](https://cursor.com/docs/context/skills).

### Gemini CLI

Use the same commands as Codex: Gemini CLI reads `~/.agents/skills` as an alias of `~/.gemini/skills`. In a session, run `/skills reload`, then `/skills list`. From the terminal, run `gemini skills list --all`. For one repo, use `.agents/skills/iso`. Its docs say Antigravity CLI replaced it for unpaid tier and Google One users on 18 June 2026. Source: [Gemini CLI skills](https://geminicli.com/docs/cli/skills/).

### Antigravity (app, CLI, IDE)

```sh
git clone --depth 1 https://github.com/GA-MO/isokit.git
mkdir -p ~/.gemini/config/skills
cp -R isokit/skill ~/.gemini/config/skills/iso
cd ~/.gemini/config/skills/iso/scripts && bun install
```

In the CLI, run `/skills reload` or start a new conversation. In the IDE, open the Customizations menu in the agent side panel. For one repo, use `.agents/skills/iso`. Source: [Antigravity skills](https://antigravity.google/docs/skills).

### GitHub Copilot (CLI, VS Code, cloud agent)

Use the same commands as Codex (`~/.agents/skills/iso`; `~/.copilot/skills/iso` works too).

- Copilot CLI: run `/skills reload`, then `/skills list` in a session, or `copilot skill list` in the terminal.
- VS Code: type `/` in a new chat, run `/skills`, or run Chat: Open Customizations and select Skills.
- Cloud agent: commit the skill to the repo (`.github/skills/iso`, `.claude/skills/iso` or `.agents/skills/iso`), or put it in `.copilot/skills` in your dotfiles repo.

Sources: [About agent skills](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills), [Copilot CLI skills](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills), [VS Code agent skills](https://code.visualstudio.com/docs/copilot/customization/agent-skills).

### Devin Desktop (formerly Windsurf)

Use the same commands as Codex: Devin Desktop reads `~/.agents/skills` next to its own `~/.config/devin/skills`. Click Customize in the agent sidebar and open the Skills tab, or type `/iso`. For one repo, use `.agents/skills/iso` (`.devin/skills` and the legacy `.windsurf/skills` work too). Sources: [Devin Desktop skills](https://docs.devin.ai/desktop/cascade/skills), [Devin Desktop FAQ](https://docs.devin.ai/desktop/devin-desktop-faq).

### opencode

Use the same commands as Codex. opencode also reads `~/.config/opencode/skills` and `~/.claude/skills`. Ask it which skills it can load: it lists them in its `skill` tool. If `iso` is missing, check that no `permission.skill` rule in `opencode.json` denies it. For one repo, use `.agents/skills/iso`. Source: [opencode skills](https://opencode.ai/docs/skills/).

### goose, Amp, Junie, Kiro

goose, Amp and Junie read `~/.agents/skills`, so use the same commands as Codex. Check with `goose skills list`, `amp skills list`, or `/skills` in Junie. Kiro reads `~/.kiro/skills`, and only in the IDE:

```sh
mkdir -p ~/.kiro/skills
cp -R isokit/skill ~/.kiro/skills/iso
```

Then find it under Agent Steering & Skills in the Kiro panel, or type `/` in chat. Sources: [goose](https://goose-docs.ai/docs/guides/context-engineering/using-skills), [Amp](https://ampcode.com/docs/customize/skills), [Junie](https://junie.jetbrains.com/docs/agent-skills.html), [Kiro](https://kiro.dev/docs/skills/).

### Update

Run `git pull` in your clone. If you copied the folder instead of linking it, copy it over again: `cp -R isokit/skill/. ~/.agents/skills/iso/`.

## Use

Ask your agent for a scene in plain words, for example:

> Draw one event fanning out to email, push and SMS, each channel lighting up as it receives it.

The skill reads `skill/SKILL.md` and `skill/recipes.md`, writes a scene module, renders it with `skill/scripts/render.ts`, takes screenshots at phone and desktop widths, and fixes what looks off. Every card on the showcase shows the prompt behind its scene.

To render an example yourself:

```sh
cd skill
bun scripts/render.ts examples/notifications.ts out/notifications.html
node scripts/shots.mjs page=out/notifications.html times=0,1,2 loop=1 widths=393,1280 out=out/shots
```

## The kit

`skill/lib/iso.ts` builds scenes at build time and has no dependencies. `skill/lib/runtime.ts` plays them in the browser.

```ts
import { Scene, responsive, lazyBox } from './skill/lib/iso';
import { mountAll, mountLazy } from './skill/lib/runtime';

const s = new Scene({ name: 'deploy', width: 720, height: 400 });
s.slab({ id: 'build', at: [0, 0, 0], size: [120, 120], height: 28, top: '#1b1c22', side: { kind: 'flat', color: '#5b21b6' } });
s.dropIn('build', 0.1);
s.loop(6, 2.2);

s.render();      // HTML for a page: SVG, labels and the motion spec
s.exportSvg();   // one standalone SVG, animated with CSS @keyframes, no script
```

- Inline scenes: put `responsive(compact, wide)` on the page and call `mountAll()` once.
- Many scenes on one page: write each `scene.render()` to its own file at build time, put `lazyBox(compact, wide, breakpoint)` where it goes, and call `mountLazy({ src: name => '/scenes/' + name + '.html' })`. Each box reserves its height, and only the copy that fits its width is fetched when it nears the screen. The showcase works this way.
- `exportSvg()` needs every piece of text drawn with `text()`. It throws on an HTML `label()` and names it.

`skill/SKILL.md` has the whole API, the visual rules and the Astro setup.

## What is in `skill/examples/`

There are 39 scenes for fictional products at four levels, in four categories (the showcase tabs: Product, Security, Infra, Data & AI). Every tab has at least one scene at every level.

- Spot: small one- or two-object scenes for feature lists, empty states and loaders: a lock, a sync loop, a filling inbox, a charging battery, a bell, a table scan, a tile loader and an empty box.
- Simple: CI/CD, notifications, file upload, database branching, a service map you can hover, an audit ledger, DNS resolution and cron jobs.
- Medium: auth, ETL, queue and workers, search index, a feature flag rollout you can play, key rotation, a firewall, zero-trust access, a workload scheduler, autoscaling, health checks, a blue-green release, a snapshot restore, embedding clusters, a training loss curve, a re-ranking shelf and an A/B test.
- Complex: an AI agent calling tools, payments, edge cache, observability, a data erasure request and a retrieval-backed answer.

There is also the hero, and the 49 side finishes in `materials-*.ts` with one gallery per family in `material-gallery.ts`. Slab sides use the `paints` in `shared.ts` (gradient, brushed metal, stripes, dots, glass, a seeded random mosaic and flat colour).

## Numbers

All numbers were measured on 2026-11-06 on an Apple silicon Mac with Chrome. 1 kB = 1024 bytes.

| What | Raw | Gzip |
|---|---|---|
| Showcase `index.html` (the hero inline, 45 empty scene boxes, the install tabs) | 580.6 kB | 49.3 kB |
| Showcase CSS | 24.2 kB | 5.5 kB |
| Showcase JS bundle (runtime, `mountLazy()`, the site's retry note) | 5.6 kB | 2.2 kB |
| Showcase inline JS (copy buttons, filter, install tabs, flag demo, hero tilt) | 7.0 kB | 2.6 kB |
| All 82 scene files in `site/dist/scenes/` (compact and wide copies) | 9545.6 kB | 738.6 kB |
| Largest scene file (`embed-lg.html`) | 389.6 kB | 21.7 kB |
| Scene runtime alone (`skill/lib/entry.ts`, `mountAll()`) | 3.3 kB | 1.4 kB |
| Runtime with `mountLazy()` | 4.8 kB | 2.0 kB |
| `docs/svg/hero.svg` (the image at the top) | 152.8 kB | 14.8 kB |

The page does not grow with the number of scenes. Each card holds an empty box that keeps its height. When the box comes within 75 % of a screen height of the viewport, the page fetches only the copy that fits, compact or wide, and mounts it. A visitor who scrolls the whole page loads one file per box (45), not all 82.

Hero motion on the built showcase, 20 s of the loop, CPU throttled 4x in Chrome:

| Viewport | Frame rate | Frame time p50 / p95 / p99 | Late frames (over 20 ms) | Long tasks | Main thread busy |
|---|---|---|---|---|---|
| 393 px (phone) | 60.0 fps | 16.7 / 16.7 / 16.8 ms | 0 | 0 | 36.2 % |
| 1280 px | 60.0 fps | 16.7 / 16.7 / 16.8 ms | 0 | 0 | 43.8 % |

How they were measured:

- Sizes: `bun run build && bun run size` at the repo root. `site/scripts/size.ts` gzips each file in `site/dist` at level 9 and sums the inline module scripts and the scene files.
- Runtime rows: `bun build skill/lib/entry.ts --minify --target browser > out.js`, then `wc -c < out.js` and `gzip -9 -c out.js | wc -c`. The `mountLazy()` row bundles a one-line entry that calls it.
- SVG rows: `bun run readme:svg`, which writes `docs/svg/` and prints each file's size.
- Hero motion: `node skill/scripts/perf.mjs page=<built showcase URL> width=393 throttle=4 seconds=20 selector=.iso-compact` (and `width=1280 selector=.iso-wide`). It counts `requestAnimationFrame` frames, reads long tasks, and takes main-thread time from Chrome's `Performance.getMetrics`.

Fonts are not counted. The site self-hosts Inter and Fira Code as `woff2`. The SVGs in `docs/` fall back to the system's sans and monospace fonts.

## Develop

```sh
bun install          # at the repo root (installs site/)
bun run dev          # showcase dev server
bun run build        # static build into site/dist, served under /isokit/
bun run test         # kit and example tests
bun run readme:svg   # rewrite the animated SVGs in docs/svg/
```

Pushing to `main` deploys the site to GitHub Pages through `.github/workflows/pages.yml`. Set the repository's Pages source to GitHub Actions (Settings, Pages) once before the first deploy.

## License

MIT. See [LICENSE](LICENSE).
