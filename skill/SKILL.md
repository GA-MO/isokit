---
name: iso
description: Draw animated isometric product illustrations in a premium dev-tool style (rounded slabs, layer stacks, wires with light pulses, labels, looping explainer motion) as hand-written SVG + CSS/WAAPI with no animation library. Use for "draw an isometric flow", "explainer animation", "isometric diagram of our system", "วาด flow แบบ isometric", "ทำภาพอธิบายระบบ", and hero or feature illustrations on landing pages of dev tools and SaaS.
---

# iso: animated isometric explainers

A scene tells one product story in one 6 to 14 second loop: things arrive, light travels between them, one part lights up at a time, and the loop returns to its first frame. A flow is only one shape. Pick the shape the story needs from the beat table: a box that opens to show its layers, a hand-off between two objects, a grid that fills, a stack that rotates a choice, or tiles the viewer lifts by hovering. Everything is real SVG and HTML text, scales with its box, pauses off screen and stills for reduced motion.

The kit lives next to this file:

- `lib/iso.ts`: the `Scene` builder (projection, slabs, faces, wires, pulses, labels, motion tracks), `scene.exportSvg()`, `responsive()` and `lazyBox()`.
- `lib/runtime.ts`: plays a rendered scene with WAAPI, starts its intro once 40 % of it (or half the screen height, for a tall scene) is in view, pauses it off screen, drops its animations once it is more than half a screen away and puts them back on the same frame before it returns, stills it for reduced motion, exposes `window.isoSeek(t)`.
- `scripts/render.ts`: renders a scene module (default export `Page`) to one standalone HTML file with the runtime inlined.
- `scripts/shots.mjs`: screenshots any page at chosen times and widths and writes `sheet.png`.
- `scripts/check.ts`: strict type-check of scene files anywhere on disk against the kit (`bun scripts/check.ts scene.ts`).
- `scripts/page-idle.mjs`: scrolls a page with many scenes through once, then stops at 0, 20, 35, 50, 60 and 80 % and prints main-thread time at each, with the CPU at 1x and 4x (`node scripts/page-idle.mjs page=<url> width=393 dpr=3 scroll=4`). Run it on any page with more than a few scenes.
- `scripts/perf.mjs`: plays a page in Chrome at a phone width with the CPU throttled (`node scripts/perf.mjs page=<out.html> width=393 throttle=4 seconds=20`) and prints frame rate, frame-time percentiles, late frames, long tasks and main-thread time. Run it on any scene with 30 or more moving objects.
- `scripts/contrast.mjs`, `scripts/render-all.ts`: measure every text in a rendered page against the pixels right behind its glyphs at the still frame and four more moments, and fail under 4.5:1 (`node scripts/contrast.mjs <out.html>`; `bun scripts/render-all.ts <dir>` writes every catalog example first). Run it on every scene before you call it done.
- `scripts/study-rive.mjs`, `scripts/compare-rive.mjs`: optional tools for studying a `.riv` animation of your own frame by frame and comparing it with a kit scene. Both need `runtime=<folder with canvas_advanced.mjs and rive.wasm>`.
- `examples/`: 51 scenes for fictional products, each one file that exports `example` (title, `ask` (the short prompt that heads its showcase card), story, prompt, level, `intent` (what it explains: `flow`, `scale`, `inside`, `change`, `choose` or `talk`; spots have none), layout, surface (`light`, or `night` for the few dark ones), interaction, and `art`: the compact and wide scenes from `art(compact, wide, breakpoint)`) and a default `Page`, so `scripts/render.ts` renders any of them. A `spot` scene is a single small scene, `art(compact)`. `hero.ts` exports `hero` (an `Art`, drawn without its prompt because the page shows the prompt in HTML), `readme` (the same scene with the prompt typed into a terminal card, for `exportSvg()`) and `prompt`; `material-gallery.ts` exports `galleries` (one `Art` per finish family), each with a default `Page`. `examples/shared.ts` holds the surfaces, colour ramps, `paints`, fonts and `fitX()`, which keeps a label inside its scene on the narrowest card it will sit in.

Pick the example closest to your story and read it before drawing:

| Example | Level | Shows |
|---|---|---|
| `notifications.ts` | simple | the minimal file: one core fanning out to three tiles, pulses, arrival flash and hop. Read it first |
| `ci-deploy.ts` | simple | a package hopping along a chain, a squash on landing, a state colour only at the end |
| `file-upload.ts` | simple | chunks filling a progress bar, then copies spreading to edge points; marching dashes on empty slots |
| `db-branching.ts` | simple | a dashed ghost that turns solid, a change tile that glides back and merges |
| `service-map.ts` | simple | hover: nine `slab({ hover })` tiles with labels revealed on hover or tap, plus a loop that still tells the story |
| `auth-flow.ts` | medium | an upright `panel()` phone, typed input, hand-off ghosts carrying a token |
| `etl-pipeline.ts` | medium | source tiles feeding a core along wires that draw in with them, then a fill-and-empty grid; overlays grouped with the slab they sit on so they move together |
| `queue-workers.ts` | medium | a slot queue driven by an event table the build validates (no overflow, no take from empty) |
| `search-index.ts` | medium | line-art tiles on a light page, a typed query, matches lighting, ranked results rising |
| `feature-flags.ts` | medium | play: a real `<button>` in a label and an inline script that replays one loop step with `seek` |
| `agent-tools.ts` | complex | a core with satellites, call and reply pulses, an answer card that types in |
| `checkout-payment.ts` | complex | a ring of steps with a dashed return path and a status line that crossfades |
| `edge-cache.ts` | complex | the same request twice: a warm miss to the origin, then a cool hit at the edge |
| `observability.ts` | complex | three signal looks (dashes, dots, spans), `prism` bars with `heightTo`, an alert and recovery |
| `keycard-slot.ts`, `battery-charge.ts`, `tile-loader.ts`, `empty-box.ts` | spot | one small object for a feature list, loader or empty state; an upright `panel()` card clipped at a slot's lip, `heightTo` cells, a diagonal drop wave, marching dashes |
| `sync-loop.ts`, `inbox-fill.ts`, `table-scan.ts` | spot | arrows squashed onto the plane, a glass-fronted tray, a lens gliding row by row |
| `audit-ledger.ts`, `dns-resolve.ts`, `cron-jobs.ts` | simple | pages stacking with seals, one hop at a time with replies, a dial that triggers jobs |
| `vault-rotate.ts`, `firewall-filter.ts` | medium | a key swap with the slot pattern, a rejected packet bouncing back |
| `workload-scheduler.ts`, `health-check.ts` | medium | placement from a small rule table, a node pulled out and rejoined |
| `blue-green.ts`, `snapshot-restore.ts` | medium | a re-targeted wire, a cursor sliding back along a timeline |
| `embedding-clusters.ts`, `training-loss.ts`, `recs-rerank.ts`, `ab-test.ts` | medium | points settling into clusters, falling `prism` bars, a slot shelf re-ordering, a split with a winner |
| `rag-answer.ts` | complex | retrieved cards flying into a model and an answer typing in |
| `hero.ts` | complex | one prompt grows a system in tiers of 1, 5, 15 and 40: a turntable spin-in and a weighted drop, outputs sliding out from under, pops, a pool that drops in with a grid fill, endless requests, a tilt toward the mouse at rest; flashes by `fill` and repeated tiles by `<use>` to stay cheap; SVG `text()` only, so `exportSvg()` works on it |
| `funnel-live.ts`, `billing-cycle.ts`, `parcel-delivery.ts`, `test-shards.ts` | medium, complex | `layout: 'wide'`: 3:1 strips read left to right (stages narrowing, a month strip that shifts without a jump, vehicles carrying a box, shards racing in lanes and merging) |
| `stock-sync.ts` | complex | `layout: 'diagonal'`: a change travelling house to house along one iso axis until every total agrees |
| `live-cursors.ts`, `two-approvals.ts`, `translate-six.ts` | medium | `layout: 'panels'`: upright `panel()`s facing each other; cursors typing, two ticks that unlock a lock, one message in six languages with a Thai and Japanese font stack |
| `smart-home.ts` | medium | `layout: 'radial'`: devices around a hub changing state in turn |
| `build-cache.ts`, `calendar-booking.ts`, `load-slider.ts` | simple to complex | `layout: 'field'`: cache hits worked out from a dependency table, a meeting skipping a conflict; `load-slider` is a drag control (a real range input, mouse, touch and keys) that seeks the loop while ambient traffic keeps moving |
| `video-transcode.ts`, `fraud-gauge.ts`, `data-lineage.ts`, `drill-down.ts` | simple to complex | `layout: 'exploded'`: renditions lifting apart and encoding, risk layers adding up past a line, an upstream path lighting down through layers; `drill-down` opens a part into its layers from a real button by seeking that part's loop segment |
| `materials-*.ts`, `material-gallery.ts` | | 49 side finishes in six families (Metal, Glass, Natural, Tech pattern, Retro, Generative) as `(scene) => Material` factories, one label-free gallery per family. Generative finishes take a seed. Copy a finish rather than inventing one |

Setup once: `cd <this dir>/scripts && bun install && bunx playwright install webkit` (screenshots use the installed Google Chrome for Chromium). Type-check: `scripts/node_modules/.bin/tsc -p <this dir>`.

## 1. Storyboard before drawing

Open `recipes.md` first. It holds every measured motion and composition pattern (arrivals, connections, streams, comparisons, choice, idle, interaction, easings, surfaces), each with its numbers and kit calls. Compose the story from those recipes and keep their timings.

Write the story as a timeline table first: what the viewer should understand, the 3 to 6 beats that show it, and for each beat which element moves, how, when and for how long. One idea per beat. A beat that needs a paragraph to explain is two beats or the wrong picture.

Proven beat shapes, with measured timings:

| Beat | What happens | Timing |
|---|---|---|
| Arrive | Pieces drop in one by one, overshoot a little, settle | `dropIn`: 0.55 s each, 83 ms stagger, 46 px fall |
| Hand-off | Ghost outlines of a tile slide from one object to another | 4 ghosts, 0.22 s apart, 1.2 s each, `ease.io` |
| Travel | A short light pulse runs along a wire; the target flashes on arrival | 270 px/s, pulse ~0.12 to 0.16 of the wire, rise 0.1 s, fade 0.6 s |
| Reveal layers | A solid box goes see-through; inner layers light one at a time with a label | on 0.23 s, hold ~1 s, off 0.2 s, next starts as the last ends |
| Rotate the choice | A stack shifts up one slot; the active card turns accent | 0.9 s move every 3 s, slow start, long ease-out |
| Fill and empty | A grid fills tile by tile, holds, drops back to empty | 7 frames (0.12 s) apart in, 2 frames apart out |
| Tug | When a wire shrinks or grows, the box it is attached to is pulled about 6 px along the wire, holds, then eases back, so the wire looks like it has tension | 0.23 s pull, 0.25 s hold, 0.65 s back with a long ease-out |
| Hover lift | A tile rises 16 px and takes its brand colour, its name appears | `slab({ hover })`: 270 ms on, 325 ms off, `ease.out` |

Connection rule: a wire is on screen only while both of its ends are. A wire to something that arrives mid-loop draws itself in with its pulse (`wire({ dash: '1 1' })`, then `at(id, 'strokeDashoffset', t, d, 1, 0, ease.linear)`) and leaves with the thing it joins. Never put such a wire in the intro. A wire never crosses the top face of a box: add it before the objects it joins (so they paint over it) and start it at the box's edge, not its centre.

Loop rule: the last frame equals the first. Anything that changes during the loop changes back before it ends. Intro-only motion goes in `intro()`; the loop starts when the intro ends, and the intro must end on the same picture the loop starts with. An element with no intro shows the loop's starting value during the intro, which is the last `to` of its loop segments.

Paint order is fixed: what is added later always covers what was added earlier. Motion that would change who covers whom (a card moving from the top of a stack to the bottom) is drawn as slots instead. Each element is a slot that moves one step and fades or recolours like its neighbour, and every segment starts again from the slot's rest value, so all slots jump back together while the picture looks the same. Give each slot one label per option and crossfade which one shows beside the active slot.

## 2. Pick a layout, then compose for the phone first

Every example names its composition in `layout`: `wide` (a long strip read left to right; its wide scene is about 3:1, such as 1200x400, with breakpoint 720, and the showcase shows it as a full-width card), `diagonal` (a long row along an iso axis), `panels` (upright `panel()`s facing each other), `radial` (a core with things on a ring), `field` (many tiles seen from high up; a slightly steeper `ratio` helps), `exploded` (layers lifted apart vertically) or `object` (one or two objects for a feature list or empty state). Pick the one the story needs before drawing; a page of scenes reads better when they vary.

A scene the viewer can play (`interaction: 'play' | 'drag' | 'explore'`) ships a small inline module script in `art()`'s `head`: real `<button>` or `<input type="range">` in a `label({ html })`, pointer events for mouse and touch (`touch-action: none` on a drag control), keys too, a `MutationObserver` to bind scenes that mount later, the loop paused while the viewer acts and resumed after a few idle seconds, and a loop that still tells the story with no input (`feature-flags.ts`, `load-slider.ts`, `drill-down.ts`).


Booth and landing pages are opened on phones. Build two scenes and wrap them with `responsive(compact, wide)`:

- **compact**: about 390 wide, portrait or square (390x420 to 390x640). Stack the story top to bottom. Design at 390 units so a label `size: 13` is 13 px on a phone. Never below 13.
- **wide**: about 900 to 1200 wide, landscape, the story left to right.

Same ids are fine in both because each scene has its own `name` prefix. `responsive(compact, wide, breakpoint)` switches on the width of its own container, not the window, so it also works inside a narrow column.

## 3. The visual language

- **Projection**: true isometric. Plane x runs down-right, y runs down-left, z is up. `scene.project([x, y, z])` gives screen coordinates. Put the subject near the origin and set `origin` to where it should sit on screen.
- **Slabs** (`slab()`): rounded squares with real thickness. Radius about 12 to 20 % of the side. Thickness 18 to 30 for tiles, 120+ for a tall box. White or near-white top with light `grain` (.06 to .1) on light pages; near-black top with grain on dark pages. Sides take a material:
  - `paints` in `examples/shared.ts` are the default sides, each a `Material` built from a 4-colour ramp dark to light (`ramps.violet` and friends): `paints.gradient(s, ramp)` (the default: a lit top edge fading down to the darkest colour), `paints.brushed(s, ramp)` (fine horizontal metal lines; graphite or silver for neutral tiles), `paints.stripes(s, ramp, width?)`, `paints.dots(s, ramp, gap?)`, `paints.glass(s, tint, opacity?)` (pair it with `translucent: true`), `paints.random(s, ramp, seed, cell?)` (a seeded pixel mosaic: the same seed draws the same pattern, so give each tile its own seed) and `paints.flat(color)`. One accent ramp on the object that acts, neutral graphite or silver on the rest.
  - `{ kind: 'flat', color }`: the plain colour behind `paints.flat`.
  - `{ kind: 'marble', colors, streak? }`: an `feTurbulence` stone texture the kit still draws. The examples never use it; reach for it only when a brand asks for stone.
  - `{ kind: 'image', href, right?, corner?, opacity? }`: a raster texture (WebP data URL) sheared onto each face, embedded once and reused by every corner strip. Use it when a designer supplies the texture or the look needs baked lighting; set `shade: false` on the slab when the lighting is already in the image. Export at 2x the size the side is shown, quality 0.9 or more for grain (0.8 erases it). Measured on two scenes: a raster copy of a filter paint looks the same and costs the same, so filters stay the default; what makes a textured side look better is its design (fine streaks, lighting along the face, a bright rim), not the format.
  - `{ kind: 'custom', paint, corner?, opacity? }`: any SVG paint. `paint(face, area, transform, band)` returns markup for one side: fill `area` and put `transform` on what you draw, so stripes, patterns and gradients lie on the face (`band.y0` to `band.y1` is the side's height on screen, for vertical gradients). Copy a finish from `examples/materials-*.ts` (each is a `(scene) => Material` factory that registers its patterns with `def()`) rather than inventing one.
  - The kit bends every material around the rounded front corner: the corner is cut into 12 strips, each sheared to the curve's slope, and the two sides' paints crossfade along it, so a stripe turns the corner as one line instead of breaking at a seam. Paints built from `feTurbulence` noise re-render per strip and show vertical lines, so they crossfade the corner instead (`corner: 'fade'`; `kind: 'marble'` does this by itself). Every paint in `paints` is built from gradients and patterns, so it bends.
  - For see-through sides (glass) paint them opaque and set `opacity` on the material: translucent strips stack and show hairlines where they overlap. Set `translucent: true` on the slab when its top is see-through, so the side paint is cut out under the top face instead of showing through it.
  - The left side darkens by 10 % and fades to the right side across the corner.
- **Faces** (`face()`): flat outlines on a plane for layers, slots, ghosts and wireframes. 1 px, low-contrast stroke; dashed (`dash: '4 3'`) for "inside" or "virtual".
- **Wires** (`wire()`): run along the plane axes (change x, then y) with rounded corners, 1 to 1.5 px, 25 to 40 % of the accent. **Pulses** (`pulse()` + `travel()`): the accent at full strength with a soft glow.
- **Labels** (`label()`): real text in a pill (mono, small) or a `card` (`html` for a richer answer card). They sit beside what they name, joined by a short wire when they are not touching it. Thai text uses the page's Thai font and never letter-spacing.
- **Colour**: the page's own tokens. One accent family per scene plus neutrals. A second colour only for a state change (for example a warm colour for "needs a person").
- **Depth**: draw back to front. Later layers paint over earlier ones, so add the far objects first.
- **Restraint**: 5 to 9 objects, generous empty space, nothing that does not carry the story.

## 4. Motion API

All motion is declared on the scene and compiled into WAAPI keyframes, one track per element and property, so it can be paused and seeked.

```ts
s.dropIn('core', 0.1);                                  // intro arrival
s.intro('core-label', 'opacity', 0.5, 0.3, 0, 1, ease.out);
s.loop(8, 3.2);                                          // loop length and the reduced-motion still time
s.travel('p1', 0.4);                                     // pulse along its wire at 270 px/s (or pass a duration)
s.hold('core', 'translate', 2.0, 0.25, 0.8, 0.35, '0 0', '0 -10px'); // lift, hold, return
s.at('card', 'opacity', 5.0, 0.3, 0, 1);                 // any single segment
s.typeIn('question', 0.2, 1.0, 12);                      // reveal a label left to right in 12 steps
s.dropAt('tile3', 0.6);                                  // dropIn inside the loop; give it an exit too so it is hidden before it falls
s.at('ghost', 'translate', 0.5, 1.2, '0 0', s.offset(from, to)); // move along the plane from one 3D point to another
s.tug('platform', 2.0, '-6px 0');                         // pulled by a wire: 0.23 s out, 0.25 s hold, 0.65 s back
s.frame({ id: 'cage', at: [0, 0, 160], size: [150, 150], height: 160, stroke: 'rgb(255 255 255 / .3)' }); // dashed wireframe box
```

Hover: `slab({ ..., hover: { lift?, top?, side?, edge?, label? } })` lifts the slab (16 by default) and crossfades to the hover look when the mouse enters it, and on tap on touch screens. Every lift plays to the top (270 ms) before it drops, even when the mouse only brushes past, so a quick sweep leaves a trail of several tiles up at once, (a tap elsewhere puts it down). `guides` draws dashed lines under the lifted corners in that colour. `label` names a label drawn before the slab; it stays hidden until the slab is hovered. A hover slab stays on screen once it arrives (no opacity in the loop) and its label is never animated; the builder throws on both, because a hidden slab still catches the pointer and an animated label ignores the hover. Taps act on release and ignore swipes, so scrolling over a tile does not lift it. Hover tells nothing on a phone until tapped, so the scene's intro or loop must still tell the story.

- A value holds between segments and steps to the next segment's `from` at its start; nothing drifts across a gap.
- An element animated only inside the loop takes its loop starting value during the intro (the loop's last `to`), so things that appear mid-loop stay hidden while the intro plays.
- `translate` in px on a label is converted to scene units, so a label and its slab move together at every width.
- Labels never render below 13 px, whatever the scene is scaled to. So a label near an edge grows past it when the scene is shown narrower than its design width: place such labels with `fitX(x, text, sceneWidth, narrowestPx, anchor)` from `examples/shared.ts`.

Animatable props: `opacity`, `translate`, `scale`, `rotate`, `strokeDashoffset`, `filter`, `fill`, `stroke`, `color`, `backgroundColor`, `borderColor`, `boxShadow`, `clipPath`. Use `translate` and `scale` on whole objects (they pivot on their own centre), never on the inner transformed face. Segments of one element and property must not overlap; the builder throws with the id and time when they do, and when a segment runs past the loop.

For a highlight that can't be expressed as a property change on an existing element, draw a second copy (for example an accent `face()` over a grey one) and animate its `opacity`.

More building blocks:

- `s.group(id, () => { ... })` wraps everything drawn inside into one animatable group (a stack that moves, a tile with its icon). HTML labels cannot join a group; use `text()`.
- `s.pivot(id, at)` sets the point an element scales or rotates around (default: its own centre).
- `s.text({ id, at, text, size, on, along, pill })` is SVG text: flat on screen (`on: 'screen'`), printed on a top face (`'top'`, reading down-right, or `along: 'y'` reading up-right) or on a side face (`'left'`, `'right'`). Use it for text that moves in a group, sits on a surface, or must be smaller than 13 px; use `label()` for readable copy. On a side (`on: 'left' | 'right'`) it must sit on the face you see, the slab's front: `y = centre + depth / 2` for `left`, `x = centre + width / 2` for `right`, `z` between its bottom and top. The kit throws, naming that face, when it sits inside a slab or prism, on its back or just over its top.
- `s.panel({ at, size, thickness, facing, content })` is a tile standing upright, its face toward the viewer's left or right. `content` is markup in face coordinates (centre at 0 0, `size` wide), clipped to the rounded face, so a square header bar can run edge to edge without poking past a corner.
- `slab({ outline })` strokes the silhouette for line-art boxes (white sides, dark outline).
- `content` on `slab()`, `face()`, `prism()` (its cap) and `turntable()` (its top) is markup on that top face in face coordinates (centre at 0 0, `size` wide), clipped to the rounded face like `panel({ content })`; it moves with a rising cap or a spinning top.
- `s.plane(at, markup, 'left' | 'right')` lays markup on a side face; `s.planeTransform(at, on)` gives the transform for your own elements.
- `s.unproject([x, y], z)` turns a screen point back into a 3D point, for things placed by screen layout.
- `s.prism({ id, at, size, height, reach, top, side, stroke })` is a box whose height can animate: `s.heightTo(id, start, dur, from, to, easing, phase)` (bars, time saved, slow vs fast). `reach` is the tallest it will get.
- `s.turntable({ id, at, size, height, top, side })` is a box drawn as stacked layers so it can turn in its own plane: `s.spin(id, start, dur, fromDeg, toDeg, easing, phase)` (spin-in arrivals; like every helper it defaults to the loop, pass `'intro'` for an arrival). Swap to a real `slab` when it stops.
- `wire({ hidden: true })` starts invisible; `s.draw(id, start, dur)` draws it in, `s.retract(id, start, dur, 'start' | 'end')` pulls it back to its source or erases it from the source.
- `s.ambient(id, prop, period, values, easing)` runs a motion on its own clock from the first frame (shimmers, drifts) without tying it to the loop; `s.march(id, dash, gap, speed)` marches a dashed outline; `s.wobble(id, period, squash, tilt)` gives a core a living squash and rock (pivot it at its bottom first). An element with an ambient track cannot also have timed segments on the same property: wrap it.
- `s.set(id, prop, t, value)` jumps a value instantly (slot resets, stream respawns). `s.introUntil(t)` makes the intro last at least `t`, so the loop starts there.
- `slab({ hover: { on, off, onEase, offEase } })` tunes the hover timing (spring pops); `slab({ shade: false })` removes the left-side darkening for line art; `frame({ edges, bottom, fill })` chooses which edges a wireframe draws.
- `new Scene({ ratio })` flattens or steepens the view (true isometric 0.577; 0.55 to 0.6 reads a little flatter and calmer).

Raw SVG: `s.svg(id, markup, className?)` adds any markup as one animatable group; `s.plane(at, markup)` lays markup flat on the plane at `at` (text or icons printed on a top face); `s.def(id, '<linearGradient id="$ID">…')` registers a gradient or filter under a scene-unique id and returns its `url(#…)`; `s.blur(n)` returns a shared blur filter. Never hard-code ids inside raw markup: the compact and wide copies of a scene share one page.

A carousel-like story can't show every beat in one reduced-motion still. Give it a static element that names every beat (a list beside the scene) so the still still tells the whole story.

## 5. Build, look, fix

1. Write the scene module: `export default { title, background, fonts, body } satisfies Page`, with `body` holding `responsive(compact, wide)` and any surrounding copy.
2. `bun <this dir>/scripts/render.ts <scene.ts> <out.html>`.
3. `node <this dir>/scripts/shots.mjs page=<out.html> times=<every beat start, middle and end> loop=1 widths=393,768,1280,1440 out=<dir>`. With `loop=1` the times are loop times (the intro is added for you; use a negative time for a frame inside the intro). It prints each visible scene's intro and loop length. On a page with several scenes add `scene=<name>` to seek and shoot only that scene with its own intro. Then read `sheet.png` and the single frames. Also run it once with `engine=webkit` (iPhone Safari).
4. Judge each frame like a designer, at every width, the wide scene as carefully as the phone one: does every frame read at a glance, is spacing even, do no two objects touch or overlap, does every wire end on the object it joins, do labels clear their objects, is the text at least 13 px on the 393 frame, does anything overflow, does the last frame match the first. Fix and repeat until nothing is off.
5. Report the loop timeline and the sheet path.

## 6. Use in Astro

```astro
---
import { Scene, responsive, isoCss } from '~/lib/iso/iso';
const html = responsive(buildCompact(), buildWide());
---
<div set:html={html} />
<style is:global set:html={isoCss} />
<script>
  import { mountAll } from '~/lib/iso/runtime';
  document.addEventListener('astro:page-load', () => mountAll());
  mountAll();
</script>
```

A page with many scenes should not ship them all inline. Write each compact and wide copy (`scene.render()`) to its own static file at build time, put `lazyBox(compact, wide, breakpoint)` where the scene goes (an empty box that reserves the scene's aspect ratio at each width), and call `mountLazy({ src: name => url })` from `lib/runtime.ts` once in the browser:

```ts
// build time, for each scene: write compact.render() to /scenes/<compact.name>.html, the same for wide
const box = lazyBox(compact, wide, 520); // or lazyBox(compact) for a single scene
// browser
mountLazy({ src: name => `/scenes/${name}.html`, rootMargin: '75% 0px', onError: (box, retry) => { /* your retry UI */ } });
```

When a box comes within `rootMargin` of the screen, `mountLazy()` fetches only the copy that fits its width (wide from `breakpoint + 1` px), mounts it, and swaps copies when a resize crosses the breakpoint. A failed fetch calls `onError` with a `retry`; without one it shows a plain retry button. A box hidden with `display: none` waits until it is shown. `art(compact, wide, breakpoint)` in `examples/shared.ts` returns both copies' markup, names and sizes for this.

A page with many scenes stays light only if scenes nobody can see cost nothing. The kit does this on its own, so a page needs no extra code:

- `isoCss` gives each `.iso` root `content-visibility: auto`, so the browser skips style, layout and paint for a scene off screen. It sets `overflow-clip-margin: 32px` with it, because that containment clips at the scene's edge, and a pill placed right at the edge or a card's shadow would lose a few pixels. A browser without `overflow-clip-margin` (Safari) does not get the containment.
- The runtime cancels every animation of a scene that is more than half a screen away and restores each one at the frame it left before the scene comes back. Chrome and WebKit pay every frame for each paused animation on the page (measured on this showcase), so 70 paused scenes cost as much as several playing ones. A scroll, or a layout change that resizes the page or the scene (a filter that hides cards, a fold, a resize past a breakpoint), that brings a parked scene into view wakes it before that frame paints.
- A scene you hold with `el.iso.pause()` or `el.iso.seek(t)` keeps its animations wherever it is, so a script that drives a scene (a slider, a drill-down) finds them. `el.iso.play()` releases it.

Do not wrap scenes in your own `content-visibility` or `contain: paint` box that is the scene's exact size, or edge labels clip again. Check a page with `scripts/page-idle.mjs`, a few runs: at rest the median should stay under 25 % main thread at every stop.

To put a scene where no script runs (a GitHub README, docs, an email), `scene.exportSvg({ title?, background?, radius?, color? })` returns one standalone SVG file. Its motion is the same timeline compiled to CSS `@keyframes`, the pivots ride along, and `prefers-reduced-motion` holds the still frame. A standalone SVG cannot hold HTML, so every piece of text must be `text()` (with `pill` for a pill): `exportSvg()` throws and names the `label()` it found. Hover and tap do not work in an exported file, and web fonts do not load inside an `<img>`, so give the scene a font stack that ends in system fonts.

Copy `lib/iso.ts` and `lib/runtime.ts` into the project as `src/lib/iso/` (they have no dependencies). With Astro's ClientRouter, call `mountAll()` on `astro:page-load` and `el.iso?.destroy()` on `astro:before-swap`. Scenes are built at build time, so the page ships only the SVG and the small runtime. The isokit showcase site (`site/` in the repo) renders every example this way.

## Rules

- No raster images, no animation library, no canvas. SVG, HTML text, CSS and WAAPI only.
- Every scene has a reduced-motion still that tells the whole story on its own (`loop(length, still)`).
- Never copy another company's logo or artwork into a scene. The style is reusable, their marks are not.
- Copy shown in a scene follows the page's own copy rules (for a booth site: only what the product's docs and film back, Thai at 13 px or more).
