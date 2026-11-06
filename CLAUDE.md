# isokit

The iso Claude Code skill (`skill/`) and its showcase website (`site/`). Bun everywhere.

## Layout

- `skill/SKILL.md`, `skill/recipes.md`: how to draw a scene and the measured motion recipes. They are the skill's instructions, so keep them self-contained.
- `skill/lib/`: the kit (`iso.ts` builder, `runtime.ts` player, `entry.ts`). Its API and behaviour are what users' scenes depend on. Change them only on purpose, with a test in `iso.test.ts`.
- `skill/scripts/`: render, screenshot, type-check, and the optional `.riv` study tools (they need `runtime=`).
- `skill/examples/`: one file per scene. Each exports `example: Example` and `export default page(example)`. `catalog.ts` lists the ones the site shows. `shared.ts` holds the surfaces, ramps, fonts and `fitX()`.
- `site/`: Astro, static, `base: '/isokit/'`, Tailwind v4 through `@tailwindcss/postcss`. Scenes are imported by relative path and rendered at build time.
- `.github/workflows/pages.yml`: tests the skill, builds the site and deploys it to GitHub Pages from `main`.

## Commands

```sh
bun install                         # repo root, installs site/ (workspace)
bun run dev                         # site dev server
bun run build                       # site/dist
bun run size                        # gzip sizes of the build (numbers in README)
bun run check:names                 # banned-name check (CI runs it too)
bun run test                        # kit and example tests (skill/lib, skill/examples)
bun run check:contrast              # every text in every scene at 4.5:1 or more (CI runs it; needs skill/scripts deps)
cd skill/scripts && bun install     # render / shots / check tools
bun skill/scripts/check.ts skill/examples/*.ts   # strict types for scenes
```

## Rules

- No other company's names, products, sites, scenes, ideas or layouts anywhere in the repo: not in docs, easing names, comments, site copy or file names. Products in scenes are fictional. Toolchain names (GitHub, Claude Code, Bun, Astro, Tailwind, Chrome) are fine.
- The names of the companies and products this kit was first studied from must never appear, in any case and even inside longer words. `bun run check:names` (`scripts/check-names.sh`) holds the pattern, lists every hit and fails; TypeScript's empty return type in `skill/lib` is the one allowed hit. CI runs it before building.
- `bun.lock` is git-ignored at the root because it lists a transitive bundler whose name is on the banned list. Pin exact versions in `package.json` files instead. `skill/scripts/bun.lock` is tracked.
- `skill/reference/` is git-ignored and never committed.
- A new scene: copy the shape of `skill/examples/notifications.ts`, give it a `layout` and a `category`, add it to `catalog.ts`, place labels near an edge with `fitX()`, and check it with `render.ts` and `shots.mjs` at 393, 560, 768 and 1280 and with `contrast.mjs` before committing.
- The site never edits `skill/`. Scenes never edit `site/`.
