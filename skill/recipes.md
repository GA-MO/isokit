# Recipes: motion and composition, measured

Every number here was measured frame by frame from production motion design, and each one is a default that makes a scene feel finished rather than generated. Pick the recipe whose story matches, keep its timings and easings, and change only the objects, colours and distances. The scenes in `examples/` are built from these recipes; SKILL.md lists which example shows which pattern.

## How to compose a scene

- One story, one focal point. Everything else is dark at rest (within about 3 % luminance of the page on dark sites) or white line art on light sites; saturated colour appears only on the object that is acting now.
- Build left to right (input, engine, output) or centre out (core, then satellites). Hero scenes are square or tall (640x630); feature scenes are wide (640x300, 560x260).
- The core is about 30 % of the artboard width. Satellites sit on the plane axes at about 0.8 of the core's screen width from it, their tops a few units lower than the core's.
- Stacks: pitch = layer height x 1.53 (height plus a sliver of about half the height), so each top shows a band. Names on a stack's side faces are 0.73 x the layer height, light weight, grey, centred on the side and starting at the corner radius. Rows of equal objects: pitch about 1.5 object widths.
- Projection: true isometric is ratio 0.577. 0.55 to 0.63 also reads well (`new Scene({ ratio })`). Pick one per page.
- Chains: each element starts when the previous one is about 60 % done (core 0.33 s, wire 0.72, stack 0.75, wire 0.87, pill 0.93, text 1.1, labels 1.15).
- Small text on objects (9 to 12 px) is `s.text()`, on the surface it names (`on: 'top' | 'left' | 'right'`). Readable copy beside the scene is `label()` (13 px floor).
- Long loops (10 to 30 s) are several cycles with irregular gaps, plus background rhythms underneath (pulses about 2 s before each cycle, a steady 5 s beat elsewhere). Something always moves; only one thing is in focus.

## Arrivals

| Recipe | Use for | How (kit) | Numbers |
|---|---|---|---|
| Drop in | parts landing | `dropIn(id, t)` | 0.55 s, 83 ms stagger, 46 px fall, 6.5 % overshoot |
| Turntable spin-in | the product boots up (180 deg, or 240 deg braking from about 300 deg/s with a screen-y overshoot to 1.25 at 0.85 s) | `turntable({...})`, `spin(id, t, 1.0, 180, 0, 'cubic-bezier(.8,.9,.3,1)', 'intro')`; group it, `pivot` at the centre, `scale` 0 to 1 over 1.0 s `cubic-bezier(.4,.1,.1,1)`; crossfade to the real `slab` in one frame when it stops | a square looks the same every 90 deg, so 180 to 0 reads as one full turn |
| Lean and drop with weight | a hero that lands | it arrives about 1.2 core widths above its rest (278 px in a 640 artboard) and holds there 0.25 s; `scale` y 1 to 1.1 about the bottom front corner, 0.3 s ease-out; translate to +10 px in 0.63 s `cubic-bezier(.5,0,.4,1)` while the lean releases to 0.96; settle 0.4 s `ease.io` | the +10 px is 3.5 % of a 278 px fall; scale it with the fall |
| Flip-in | a card that unfolds onto the table | group pivoted at its bottom face: `rotate` -46 to +5 to 0 deg and `scale` '0.29 0.05' to '1.05 1' to '1 1.2' to '1 1', about 0.45 s in total; short form '0.55 0.06' and -32 deg to 1.08 in 0.22 s, then 1 in 0.2 s | good up to about 0.3 s, then it reads flat |
| Fade, rise, bob | calm introduction, no drop | opacity 0.12 s while rising 20 px (0.25 s ease-out), then down 18 px in 0.7 s and back in 0.95 s | stagger 0.17 s |
| Pop | satellites around a hub | `scale` 0.05 to 1.14 in 0.23 s `ease.out`, to 1 in 0.24 s `ease.io`, pivot at each bottom face | 0.167 s apart, clockwise from the top right |
| Scatter and settle | everything in one kit | per tile, back to front, t0 = 0.6 + 0.1 i: opacity in 0.1 s; translate from 60 to 190 px right and 40 to 150 px up over 2.5 s `cubic-bezier(.2,.8,.3,1.08)`; scale '1 .12' to '1 1' in 0.45 s ease-out; rotate plus or minus 20 to 40 deg to 0 over 3.4 s `cubic-bezier(.25,.9,.3,1.12)`, alternating sign | about 4 s in total |
| Deal a stack | a toolchain made of layers | top layer arrives (spin-in), tosses up 46 px (0.4 s ease-out), down to +7 (0.23 s ease-in), 0 (0.22 s ease-out); layers below slide out from under it, top to bottom, translate from -pitch in 0.22 s ease-out then settle 0.35 s ease-io | 0.18 s apart |
| Power on | a mark comes alive | the mark pops in flat, then grows its height from 0 (`prism` + `heightTo`, about 0.33 s) on a glass side with highlights; no halo | |

## Connections

| Recipe | Use for | How (kit) | Numbers |
|---|---|---|---|
| Wire with its target | never a wire to empty space | `wire({ hidden: true })` drawn before the objects it joins; `draw(id, popTime + 0.63, 0.24)`; it leaves with the thing it joins | |
| Outputs slide out from under | a core produces its first results | draw satellites before the core so they start hidden under it; translate `s.offset(insideCore, rest)` in 0.355 s `cubic-bezier(.15,.6,.6,1)`, 0.05 s apart, right after the core's overshoot; each wire draws with the same timing | |
| Pulse | traffic along a wire | `pulse()`, `travel()` | 270 px/s, pulse 12 to 16 % of the wire, target flashes on arrival (rise 0.1 s, fade 0.6 s) |
| Signal triggers an action | a command runs something | a gradient copy of the wire over the plain one: `draw` 0.2 s, hold 0.3 s, `retract(id, t, 0.25, 'end')` (erases from the source); the action starts 0.15 s after the fill | in a loop, pairs 1.5 s apart |
| Re-target | the link follows a new choice | `retract` 0.2 s ease-in toward the source, wait 0.26 s, `draw` 0.34 s ease-out to arrive as the new item settles; `tug` the node it pulls into | |
| Tug | wires under tension | `tug(id, t, '-5px 0')`, 5 to 6 px toward the wire; `tug` assumes the element rests at `0 0`, so give a moved element its own `at()` segments | 0.23 s out, 0.25 s hold, 0.65 s back |
| Engine to tag | name the command a tool ships | wire draws to the pill's far edge; the pill opens from the wire, `scale` '1 0.02' to '1 1' (or 0 to 1.045 and back), pivot on the wire, 0.22 s; text slides up 15 to 18 px inside the pill's clip in 0.13 s, never fades | 0.45 s after the engine settles |
| Screen rule for a label | name an object at its height | `wire` on `s.unproject([x, y], 0)` points; `draw` 0.6 s `cubic-bezier(.05,1,.6,1)`, then the text fades in 0.2 s | rule starts 18 px off the object |
| Routed wires | wires on the plane between screen points | start at `s.unproject(point)`, then move along +x or -y to a target screen x (`d = (targetX - projectedX) / Math.SQRT1_2`) | thin, grey, ending behind the core |
| Guides that stretch | dashed lines following a moving object | one dashed path per guide, `pivot` at its fixed end, `scale` 0 to 1 with the mover's easing | each line its own element |

## Flows and streams

| Recipe | Use for | How (kit) | Numbers |
|---|---|---|---|
| Ghost stream | B is fed by A | outline copies of A's silhouette travel to B, one every 0.286 s, 1.56 s each, `cubic-bezier(.33,0,.67,.33)` (constant acceleration); opacity on at t, off at t + 1.46 | 5 or more in flight draw the crossing lattice by themselves |
| Glass sheets | A hands its output to B | translucent `plane(..., 'left')` sheets from A to B, linear 0.9 s, one every 0.4 s, gone on arrival; draw them after B and before A | |
| Hand-off ghosts | one thing moves to another | 4 outline `face()` copies, 0.22 s apart, 1.2 s each, `ease.io`, opacity 1 - 0.22 i | |

## Comparisons and change

| Recipe | Use for | How (kit) | Numbers |
|---|---|---|---|
| Slow vs fast | same work, one finishes | two identical `prism()`s, theirs behind (smaller y) and yours in front, offset along x so both right faces show; only the side colour differs; grow both +36 px in 0.75 s `cubic-bezier(.62,.2,.1,1)`, hold 0.65 s, then in the same 0.65 s theirs `heightTo` its full height while yours drops back to its short one; print the numbers on the right faces with `text({ on: 'right' })` after the motion stops, high on the rear prism because the front one hides its base | height is time |
| Time saved | effort shrinks | a tall white `prism` squashes to a short brand-coloured one at the same spot, `heightTo` 0.75 s `cubic-bezier(.05,.6,.2,1)` (most of it in the first 0.15 s), colour fades in 0.4 s; a dashed `frame({ edges: ['left', 'right'], bottom: false })` keeps the old height | left to right, 1.4 s then 0.9 s apart |
| Package | a box reads as a product | a lid one lid-thickness above the body, moving with the body top | lid 12, gap 13 |
| Make room | a newcomer joins a row | `group` the row and pan it 18 % of the width over 1.4 s with a slow start, while the newcomer drops 75 px into the gap with a fade | |
| B built on A | two tools, one feeds the other | A pops; B slides out from behind A (painted under it) 1.25 s `cubic-bezier(.38,.08,0,.97)`; ghost stream about 2 s; A slides onto B 0.85 s `cubic-bezier(.52,.18,.25,1)`; the merged tile shrinks 0.6 s `cubic-bezier(.33,0,.91,.03)` | the empty frame lasts under 0.1 s before the loop |

## Choice and state

| Recipe | Use for | How (kit) | Numbers |
|---|---|---|---|
| Rotate the choice | pick one of N | slot stack (see SKILL.md, paint order is fixed): per beat b, the top card winds up to 1.04 and shrinks to 0 (`anticipate exit`, 0.745 s); slots translate up one pitch from b + 0.18 over 0.82 s `shift`; the `enter` card pops to 1.056 and settles (`pop in`, 0.6 s); wire `retract` 0.23 s `snap off`, `draw` 0.37 s `redraw`; pill pull 0.30 s `pull`, return 0.74 s `settle`; at b + 0.95 everything `set`s back. The cards are flat `face()`s (no side band) and each label lives inside its slot's `group`, so the card above covers it: each slot group holds one label per option and `set()` swaps which one shows when the slots jump back. The active outline rides with its card: the new one fades in linearly over 0.56 s and never brightens past its rest value (an overshoot here reads as a flicker when the wire lands), the old one fades out linearly over 0.75 s. Vary the wire, recoil and highlight start by up to 0.1 s per beat from a table so it does not look stamped | 3 s per beat; N options x 3 s loop |
| A command lights its tool | which part a command uses | pop the command tile 12 px (0.35 s `cubic-bezier(.3,1.4,.5,1)`), hide its slot label; after 0.1 to 1.4 s reveal dashed guides from the foundation corners (`clipPath` 0.9 s) and grow the foundation into a 12 px brand `prism` (0.7 s); hold 4 to 6 s; release in reverse (0.35 s, fades 0.6 s) | |
| Reveal layers | what is inside | the box goes see-through (opacity to 0.14 in 0.6 s); layers light one at a time with labels | on 0.23 s, hold 1 s, off 0.2 s |
| Fill and empty | capacity, a workspace filling | `dropAt` each tile 0.117 s apart; empty 0.033 s apart in reverse | |

## Idle

| Recipe | Use for | Numbers |
|---|---|---|
| Marching dashes | anything waiting, reserved or empty (slots, guides, placeholders); occupied things are solid | `march(id, 4, 4, 24)` on a dashed `face`, `frame` or wire: dash 4, gap 4, 24 px/s; closed outlines go clockwise, guides move toward the thing they feed |
| Wobble | a core or foundation alive at rest | `pivot(id, bottomCentre)`, `wobble(id, 5, 0.92, 1)`: squash to 0.92 and rock +1 then -1 deg every 5 s, on its own wrapper group |
| Float | one group holding the whole scene | translate 8 to 9 % of the hub width (16 px), 3 s each way `ease.io` |
| Weight wave | a stack breathing | layer k translates 40 % of the pitch, start 0.22 k, 1.0 s down, 1.1 s back; play it twice (for example at 6.1 s and 10.4 s), rest, then fold the stack away (layer k swells to 1.05 from 0.1 k, shrinks to 0 in 0.27 s about its bottom centre) inside one 18 s loop |
| Border shimmer | a static label stays alive | a band of light slides along the pill's top and bottom edges together (bottom about half as bright), masked to the border, at about 22 px/s on its own `ambient()` clock (a 40 s ping-pong works well), never tied to the beat loop |
| Living border | a glowing edge | a mask of the border stroke over a wide repeating gradient translating linearly across the loop, about 70 % opacity |
| Sway | a whole field | rotate or translate the `<svg>`'s wrapper, not every tile (a moving parent over many animated children is the expensive case) |

## Interaction

| Recipe | How (kit) | Numbers |
|---|---|---|
| Hover lift with a trail | `slab({ hover: { lift, side, guides } })` | lifts play to the top before dropping: on 270 ms, off 325 ms, hold 270 ms; a quick sweep leaves several up |
| Spring pop | `hover: { lift: 24, on: 420, onEase: 'linear(0, .42 6%, .8 14%, 1.2 26%, 1.38 36%, 1.32 45%, 1.12 62%, 1.02 80%, 1)', off: 270, offEase: 'cubic-bezier(.5,0,.75,0)' }` | rises to 138 % at 150 ms, falls with gravity |
| Icon lights up | draw the icon in the slab `content` with a class and colour it from page CSS: `.iso-hover.is-hot .icon{fill:#fff}` | 150 ms transition |
| Tap to play | a real `<button>` in `label({ html })` plus a small inline script that pauses the scene and replays one step of the loop with `seek`; see `examples/feature-flags.ts` | the loop must tell the story with no input |

## Easing library

These recipes never use an oscillating spring. What reads as "spring" is two things: travel curves with a long tail (the second control point at x 0.03 to 0.05, so the last 10 % of the move takes 30 to 45 % of its time), and one overshoot keyframe on arrivals and exits (scale only) followed by a settle. Travel never overshoots. Brightness changes are linear crossfades. If a scene looks fast and springless, the tails are too short.

| Name | Curve | Feels like |
|---|---|---|
| shift | `cubic-bezier(.49,.19,.28,.81)`, 0.82 s | a stack moving one slot |
| settle | `cubic-bezier(.39,.08,.04,.91)`, 0.74 s | coming home after a tug (not the kit's `ease.settle`, which is the second half of `dropIn`) |
| pull | `cubic-bezier(.41,.27,.05,.79)`, 0.30 s | a node pulled by its wire |
| snap off | `cubic-bezier(.45,.86,.17,.96)`, 0.23 s | a wire retracting |
| redraw | `cubic-bezier(.31,.12,.03,.72)`, 0.37 s | a wire drawing to its new target |
| anticipate exit | `linear(0, -0.007 11.8%, -0.045 37.8%, -0.048 57%, -0.028 63.2%, 0.018 69.3%, 0.079 74.3%, 0.164 79.3%, 0.27 84%, 0.392 88.3%, 0.459 90.3%, 0.535 92.3%, 0.609 94%, 0.694 95.8%, 0.777 97.3%, 0.859 98.5%, 0.942 99.5%, 1)`, 0.745 s, scale 1 to 0 | winds up 4 % before leaving |
| pop in | `linear(0, 0.007 1.5%, 0.033 3.3%, 0.078 5%, 0.14 6.8%, 0.216 8.5%, 0.305 10.3%, 0.709 17.3%, 0.863 20.3%, 0.936 22%, 0.987 23.5%, 1.03 25.3%, 1.052 26.8%, 1.06 28.2%, 1.06 38.3%, 1.015 67.5%, 1)`, 0.6 s, scale 0 to 1 | pops 6 % over, holds, settles |
| ease out | `cubic-bezier(.22,1,.36,1)` (`ease.out`) | most UI moves, labels |
| in-out | `cubic-bezier(.37,0,.63,1)` (`ease.io`) | travel, descents, idles |
| spin-in | `cubic-bezier(.8,.9,.3,1)` | a turn that brakes hard |
| slide out | `cubic-bezier(.38,.08,0,.97)` | B coming out from behind A |
| merge | `cubic-bezier(.52,.18,.25,1)` | two things becoming one |
| shrink away | `cubic-bezier(.33,0,.91,.03)` / `(.97,.09,1,.89)` | gone with intent |
| grow | `cubic-bezier(.62,.2,.1,1)` | heights that mean time |
| squash | `cubic-bezier(.05,.6,.2,1)` | an expo-out collapse |
| constant pull | `cubic-bezier(.33,0,.67,.33)` | streams accelerating toward a target |
| pop | `cubic-bezier(.3,1.4,.5,1)` | a tile popping out of its slot |
| rule draw | `cubic-bezier(.05,1,.6,1)` | a line shooting out, then easing |

## Surfaces

- Dark sites: tops near the page colour with a light `grain` (0.03 to 0.08), a 1 px rim a little lighter, colour only on the sides (`paints.gradient`, brushed metal, stripes, neon). Glow is a blurred copy of the shape under it, not a shadow.
- Light sites: white tops, white or brand sides, 0.6 to 1 px dark outlines (`slab({ outline, shade: false })`) for line art.
- A logo or mark on a top face is printed through the face, never rotated on screen: draw it upright in its own units and place it with `s.plane(at, '<g transform="rotate(-90)">' + mark + '</g>')`, so it reads up-right along the face's -y edge like `text({ on: 'top', along: 'y' })`. A screen rotation keeps the mark's right angles and the eye catches it at once.
- Front-facing tiles (badges): a rounded square, radius 11 % of its side, turned 45 deg and squashed in x to about 0.57; the depth is the face slid sideways by 11 to 12 % of the side, and the side is the hull of the face and the slid face (flat ridges, tight corners), never a rounded polygon through the corners. Ghost copies reuse that hull.
- Side colour ramps come in bands measured dark to bright; a pale stop in the middle reads as a soft plastic bevel.
- Cards in a stack are flat `face()`s; give a box a side only where it shows at least 2 px.
- 1 px lines sit on .5 coordinates so they stay one pixel wide; a wire into a target can brighten toward it with a gradient.
- Marks and names printed on surfaces: `text({ on: 'top', along: 'y' })` reads up-right along the front-right edge; side text for numbers and layer names.
- Text or a mark that rides a growing `prism`: pass it as `prism({ content })` (raw markup in the cap's face space), so it moves with the cap.
- A gradient in `face({ fill })` or slab `content` is resolved in the face's rotated space; for screen-aligned gradients use `gradientUnits="objectBoundingBox"` or draw them with `svg()`.
- `prism({ side: [left, right] })` shades the two faces separately (left darker).
- Upright tiles facing the viewer: `panel({ facing: 'left' | 'right' })` for identity (logos) rather than space.

## Studying a reference animation (not needed at use time)

- Play the state machine, not single timelines: layers such as `dashed` or `wobble` run on top of the intro and show nothing alone.
- Track every part over the whole longest timeline at 1/60 s before deciding where the intro ends and the loop starts; find ambient periods by lag search, never assume the beat loop.
- Compare at `scale=1`; a 2x render can drop text and move raster logos. `scripts/study-rive.mjs` plays a `.riv` file of your own frame by frame (pass `runtime=` the folder holding the Rive web runtime) and extracts the images embedded in it (often the materials); `scripts/compare-rive.mjs` puts it next to a kit scene.
- Take the projection ratio from a flat object's face (height / width), not from edge slopes.
- Measure a thin line's brightness by summing the whole line, never its brightest pixel: a moving 1 px line spreads over two rows and looks dimmer than it is, which invents overshoots. Check any overshoot against a still frame.

## Phone

- `responsive(compact, wide, breakpoint)` switches on the width of its own container. A square hero in a two-column layout gets about 560 to 600 px, so give it a breakpoint below that (480) or it shows the compact scene on desktop.

- A wide hero (1280x580) can be cropped to a centred window (about 548x580) as the compact scene: satellites spill off the edges and the core fills the phone. Give a production compact scene larger type than the 6 to 7 px the crop produces.
