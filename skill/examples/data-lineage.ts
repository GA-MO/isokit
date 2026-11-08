import { Scene, ease, type Vec3 } from '../lib/iso';
import { art, fitX, fonts, narrowest, page, paints, ramps, surfaces, type Example } from './shared';

const ui = surfaces.dark;
const teal = ramps.teal;
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const pull = 'cubic-bezier(.41,.27,.05,.79)';

type Table = { id: string; name: string; x: number; from: readonly string[] };
type Tier = { id: string; name: string; tables: readonly Table[]; picked: string };

const tiers: readonly Tier[] = [
  {
    id: 'src',
    name: 'sources',
    picked: 'raw.orders · raw.charges',
    tables: [
      { id: 'src-orders', name: 'orders', x: -105, from: [] },
      { id: 'src-charges', name: 'charges', x: -35, from: [] },
      { id: 'src-users', name: 'users', x: 35, from: [] },
      { id: 'src-events', name: 'events', x: 105, from: [] },
    ],
  },
  {
    id: 'stg',
    name: 'staging',
    picked: 'stg_orders · stg_charges',
    tables: [
      { id: 'stg-orders', name: 'orders', x: -105, from: ['src-orders'] },
      { id: 'stg-charges', name: 'charges', x: -35, from: ['src-charges'] },
      { id: 'stg-users', name: 'users', x: 35, from: ['src-users'] },
      { id: 'stg-events', name: 'events', x: 105, from: ['src-events'] },
    ],
  },
  {
    id: 'mod',
    name: 'models',
    picked: 'fct_revenue',
    tables: [
      { id: 'mod-revenue', name: 'revenue', x: -70, from: ['stg-orders', 'stg-charges'] },
      { id: 'mod-users', name: 'users', x: 0, from: ['stg-users'] },
      { id: 'mod-sessions', name: 'sessions', x: 70, from: ['stg-events', 'stg-users'] },
    ],
  },
  {
    id: 'dash',
    name: 'dashboard',
    picked: 'MRR · $48.2k',
    tables: [
      { id: 'dash-mrr', name: 'MRR', x: -40, from: ['mod-revenue'] },
      { id: 'dash-dau', name: 'DAU', x: 40, from: ['mod-sessions'] },
    ],
  },
];

const selected = 'dash-mrr';
const byId = new Map(tiers.flatMap(t => t.tables.map(x => [x.id, x] as const)));
const upstream = (id: string): string[] => [id, ...(byId.get(id)?.from ?? []).flatMap(upstream)];
const path = new Set(upstream(selected));
const edges = tiers.flatMap((t, k) => t.tables.flatMap(up => up.from.map(down => ({ id: `e-${up.id}-${down}`, up, down: byId.get(down)!, k, lit: path.has(up.id) && path.has(down) }))));

const loopLength = 11;
const selectAt = 0.4;
const dimAt = 0.9;
const traceAt = 1.2;
const hop = 0.75;
const releaseAt = 8.8;

type Layout = { name: string; width: number; height: number; origin: readonly [number, number]; k: number; wide: boolean };

function build({ name, width, height, origin, k, wide }: Layout) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const minPx = wide ? 721 : narrowest;
  const plate = { size: [290 * k, 112 * k] as const, height: 10 * k };
  const pitch = 100 * k;
  const tile = { size: 54 * k, height: 9 * k };
  const rowY = 0;
  const plateZ = (k2: number) => k2 * pitch;
  const tileAt = (t: Table, tierIndex: number): Vec3 => [t.x * k, rowY, plateZ(tierIndex) + tile.height];
  const tierOf = new Map(tiers.flatMap((t, i) => t.tables.map(x => [x.id, i] as const)));

  tiers.forEach((tier, i) => {
    const z = plateZ(i);
    s.slab({ id: `plate-${tier.id}`, at: [0, 0, z], size: plate.size, height: plate.height, radius: 20 * k, top: ui.top, side: paints.flat('#24252b'), grain: 0.06, edge: ui.edge, shadow: i === 0 });
    s.text({ id: `plate-${tier.id}-name`, at: [-plate.size[0] / 2 + 16 * k, plate.size[1] / 2 - 12 * k, z], text: tier.name, size: 11, color: '#a1a1aa', on: 'top' });

    edges.filter(e => tierOf.get(e.down.id) === i).forEach(e => {
      const upTier = tierOf.get(e.up.id)!;
      const from: Vec3 = [e.up.x * k, rowY, plateZ(upTier) - plate.height];
      const to: Vec3 = [e.down.x * k, rowY, plateZ(i) + tile.height];
      s.wire({ id: e.id, points: [from, to], stroke: 'rgb(255 255 255 / .2)', width: 1 });
      if (e.lit) {
        s.wire({ id: `${e.id}-on`, points: [from, to], stroke: teal[2], width: 1.5, hidden: true });
        s.pulse({ id: `${e.id}-p`, wire: `${e.id}-on`, color: teal[3], length: 0.3 });
      }
    });

    tier.tables.forEach(t => {
      const at = tileAt(t, i);
      const size = t.id.startsWith('dash') ? tile.size * 1.18 : tile.size;
      const lit = path.has(t.id);
      s.group(`t-${t.id}`, () => {
        s.slab({ id: t.id, at, size: [size, size], height: tile.height, radius: 10 * k, top: '#202127', side: paints.flat('#3a3b43'), grain: 0.06, edge: 'rgb(255 255 255 / .14)', shadow: false });
        if (lit) s.slab({ id: `${t.id}-on`, at, size: [size, size], height: tile.height, radius: 10 * k, top: '#202127', side: paints.gradient(s, teal), grain: 0.06, edge: 'rgb(153 246 228 / .45)', shadow: false });
        if (lit) s.face({ id: `${t.id}-glow`, at, size: [size, size], radius: 10 * k, fill: 'rgb(45 212 191 / .2)' });
        s.text({ id: `${t.id}-name`, at: [at[0], at[1], at[2]], text: t.name, size: t.id.startsWith('dash') ? 12 : 10, color: '#d4d4d8', on: 'top', anchor: 'middle' });
      });
      if (t.id === selected) {
        s.face({ id: 'pick', at, size: [size + 14 * k, size + 14 * k], radius: 14 * k, stroke: teal[2], strokeWidth: 1.5 });
        s.pivot('pick', at);
      }
    });

  });

  const top = tiers.length - 1;
  const [mx, my] = s.project(tileAt(byId.get(selected)!, top));
  const metric = 'MRR · $48.2k';
  s.label({ id: 'metric', at: { screen: [fitX(mx, metric, width, minPx), my - tile.size * 0.6 - 18 * k] }, html: `MRR <span style="color:${teal[2]}">$48.2k</span>`, size: 13, anchor: 'bottom' });

  if (wide) {
    tiers.slice(0, top).forEach((tier, i) => {
      const [x, y] = s.project([plate.size[0] / 2, -plate.size[1] / 2, plateZ(i) - plate.height / 2]);
      s.label({ id: `pick-${tier.id}`, at: { screen: [fitX(x + 22, tier.picked, width, minPx, 'left'), y] }, html: `<span style="color:#a1a1aa">${tier.name}</span> <span style="color:${teal[3]}">${tier.picked}</span>`, size: 13, anchor: 'left' });
    });
  } else {
    const y = s.project([plate.size[0] / 2, plate.size[1] / 2, -plate.height])[1];
    const text = tiers[0]!.picked;
    s.label({ id: 'pick-src', at: { screen: [fitX(s.project([0, 0, 0])[0], text, width, minPx), y + 24 * k] }, html: `<span style="color:${teal[3]}">${text}</span>`, size: 13, anchor: 'top' });
  }

  tiers.forEach((tier, i) => s.dropIn(`plate-${tier.id}`, 0.1 + i * 0.083));
  s.introUntil(0.9);

  s.loop(loopLength, 6);
  s.at('t-' + selected, 'translate', selectAt, 0.3, '0 0', `0 ${-8 * k}px`, pull);
  s.at('t-' + selected, 'translate', releaseAt, 0.74, `0 ${-8 * k}px`, '0 0', settle);
  s.at('pick', 'opacity', selectAt, 0.23, 0, 1, ease.linear);
  s.at('pick', 'scale', selectAt, 0.4, 1.12, 1, ease.out);
  s.at('pick', 'translate', selectAt, 0.3, '0 0', `0 ${-8 * k}px`, pull);
  s.at('pick', 'translate', releaseAt, 0.74, `0 ${-8 * k}px`, '0 0', settle);
  s.at('pick', 'opacity', releaseAt, 0.4, 1, 0, ease.linear);
  s.at('metric', 'opacity', selectAt + 0.2, 0.25, 0, 1, ease.out);
  s.at('metric', 'translate', selectAt + 0.2, 0.4, '0 6px', '0 0', ease.out);
  s.at('metric', 'opacity', releaseAt, 0.3, 1, 0, ease.linear);

  for (const t of tiers.flatMap(x => x.tables)) {
    if (path.has(t.id)) continue;
    s.at(`t-${t.id}`, 'opacity', dimAt, 0.6, 1, 0.28, ease.linear);
    s.at(`t-${t.id}`, 'opacity', releaseAt + 0.2, 0.6, 0.28, 1, ease.linear);
  }
  for (const e of edges) {
    if (e.lit) continue;
    s.at(e.id, 'opacity', dimAt, 0.6, 1, 0.25, ease.linear);
    s.at(e.id, 'opacity', releaseAt + 0.2, 0.6, 0.25, 1, ease.linear);
  }

  const light = (id: string, t: number) => {
    s.at(`${id}-on`, 'opacity', t, 0.3, 0, 1, ease.linear);
    s.at(`${id}-on`, 'opacity', releaseAt, 0.5, 1, 0, ease.linear);
    s.at(`${id}-glow`, 'opacity', t, 0.1, 0, 1, ease.linear);
    s.at(`${id}-glow`, 'opacity', t + 0.1, 0.6, 1, 0, ease.linear);
  };
  light(selected, selectAt);
  for (let i = top - 1; i >= 0; i--) {
    const start = traceAt + (top - 1 - i) * hop;
    const dur = 0.45;
    edges.filter(e => e.lit && tierOf.get(e.down.id) === i).forEach((e, n) => {
      const t0 = start + n * 0.06;
      s.draw(`${e.id}-on`, t0, dur, 'cubic-bezier(.31,.12,.03,.72)');
      s.travel(`${e.id}-p`, t0, dur);
      s.at(`${e.id}-on`, 'opacity', releaseAt, 0.4, 1, 0, ease.linear);
      s.set(`${e.id}-on`, 'strokeDashoffset', loopLength - 0.1, 1);
      s.set(`${e.id}-on`, 'opacity', loopLength - 0.05, 1);
    });
    const land = start + dur;
    tiers[i]!.tables.filter(t => path.has(t.id)).forEach((t, n) => light(t.id, land + n * 0.06));
    const pill = wide ? `pick-${tiers[i]!.id}` : i === 0 ? 'pick-src' : null;
    if (pill) {
      s.at(pill, 'opacity', land + 0.1, 0.25, 0, 1, ease.out);
      s.at(pill, 'translate', land + 0.1, 0.4, wide ? '-8px 0' : '0 -6px', '0 0', ease.out);
      s.at(pill, 'opacity', releaseAt, 0.3, 1, 0, ease.linear);
    }
  }
  return s;
}

export const example: Example = {
  slug: 'data-lineage',
  title: 'Data lineage',
  ask: 'Trace the MRR metric back to its source tables.',
  story: 'Sources, staging, models and a dashboard float as separate layers; selecting the MRR metric lights its upstream path down through every layer to the two exact source tables while the rest dims.',
  prompt: 'Draw data lineage as an exploded stack of layers, sources at the bottom, then staging, models and a dashboard on top: selecting a metric lights its upstream path down to the exact source tables and dims everything else.',
  level: 'complex',
  intent: 'flow',
  layout: 'exploded',
  useCase: 'Lineage',
  surface: 'dark',
  interaction: 'watch',
  art: art(
    build({ name: 'lineage-sm', width: 390, height: 580, origin: [195, 420], k: 0.95, wide: false }),
    build({ name: 'lineage-lg', width: 1100, height: 560, origin: [450, 450], k: 1.08, wide: true }),
    720,
  ),
};

export default page(example);
