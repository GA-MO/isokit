import { Scene, ease, type Vec3 } from '../lib/iso';
import { art, fonts, page, ramps, surfaces, type Example, fitX, narrowest, paints } from './shared';

const ui = surfaces.light;
const accent = '#0284c7';
const tint = 'rgb(56 189 248 / .22)';
const done = '#059669';
const travelEase = 'cubic-bezier(.39,.08,.04,.91)';
const line = 'rgb(22 23 27 / .16)';

const stages = [
  { id: 'commit', x: -250, size: 80, height: 18, name: 'commit' },
  { id: 'build', x: -90, size: 92, height: 24, name: 'build' },
  { id: 'test', x: 70, size: 92, height: 24, name: 'test' },
  { id: 'prod', x: 250, size: 128, height: 40, name: 'production' },
] as const;

const hops = [
  { from: 0, to: 1, start: 0.5 },
  { from: 1, to: 2, start: 2.5 },
  { from: 2, to: 3, start: 4.4 },
] as const;
const hopDur = 0.95;

function build(name: string, width: number, height: number, origin: readonly [number, number], k: number, wide: boolean) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const at = (i: number, z = 0): Vec3 => [stages[i]!.x * k, 0, z];
  const pkgSize = 34 * k;
  const pkgHeight = 22 * k;

  stages.slice(1).forEach((st, i) => {
    const a = stages[i]!;
    const z = -10 * k;
    s.wire({ id: `w-${st.id}`, points: [[(a.x + a.size / 2) * k, 0, z], [(st.x - st.size / 2) * k, 0, z]], stroke: ui.wire, width: 1.25 });
    s.pulse({ id: `p-${st.id}`, wire: `w-${st.id}`, color: accent, length: 0.3 });
  });

  stages.forEach((st, i) => {
    const prod = st.id === 'prod';
    const radius = st.size * 0.17 * k;
    const size = [st.size * k, st.size * k] as const;
    s.group(`${st.id}-g`, () => {
      s.slab({ id: st.id, at: at(i), size, height: st.height * k, radius, top: ui.top, side: paints.gradient(s, prod ? ramps.sky : ramps.silver), grain: 0.06, edge: ui.edge, outline: line });
      if (!prod) s.face({ id: `${st.id}-lit`, at: at(i), size, radius, fill: tint });
      if (prod) s.face({ id: 'prod-ok', at: at(i), size, radius, fill: 'rgb(16 185 129 / .36)', stroke: 'rgb(5 150 105 / .6)' });
      const name = prod && !wide ? 'prod' : st.name;
      s.text({ id: `${st.id}-name`, at: [st.x * k + (st.size * k) / 2 - 8 * k, 0, 0], text: name, size: wide ? 13 : 10, color: ui.muted, on: 'top', along: 'y', anchor: 'middle' });
      if (st.id === 'test') {
        [-16, 0, 16].forEach((dx, j) => {
          const p: Vec3 = [(st.x + dx) * k, 30 * k, 0];
          s.face({ id: `dot-${j}`, at: p, size: [10 * k, 10 * k], radius: 5 * k, fill: 'rgb(22 23 27 / .1)' });
          s.face({ id: `dot-${j}-on`, at: p, size: [10 * k, 10 * k], radius: 5 * k, fill: accent });
        });
      }
    });
  });

  s.group('pkg-move', () => {
    s.slab({ id: 'pkg', at: at(0, pkgHeight), size: [pkgSize, pkgSize], height: pkgHeight, radius: 7 * k, top: ui.top, side: paints.gradient(s, ramps.sky), grain: 0.05, edge: ui.edge, outline: 'rgb(3 105 161 / .35)' });
  });
  s.pivot('pkg', at(0, 0));

  const commitTop = s.project(at(0, 0));
  const prodTop = s.project(at(3, 0));
  s.label({ id: 'sha', at: { screen: [commitTop[0] + 44 * k, commitTop[1] - 56 * k] }, text: 'main · 4f2a9c1', size: 13, anchor: 'bottom' });
  s.label({ id: 'live', at: { screen: wide ? [prodTop[0] + 56 * k, prodTop[1] - 72 * k] : [fitX(prodTop[0], '✓ live · v2.4.1', width, narrowest, 'top'), prodTop[1] + 92 * k] }, html: `<span style="color:${done}">✓</span> live · v2.4.1`, size: 13, anchor: wide ? 'bottom' : 'top' });

  stages.forEach((st, i) => s.dropIn(`${st.id}-g`, 0.1 + i * 0.083));
  s.dropIn('pkg', 0.55);
  s.intro('sha', 'opacity', 0.6, 0.3, 0, 1, ease.out);
  s.intro('sha', 'translate', 0.6, 0.4, '0 8px', '0 0', ease.out);

  s.loop(8, 5.7);
  s.at('commit-lit', 'opacity', 0.2, 0.1, 0, 1, ease.linear);
  s.at('commit-lit', 'opacity', 0.9, 0.6, 1, 0, ease.linear);

  hops.forEach(h => {
    const from = at(h.from);
    const to = at(h.to);
    const target = stages[h.to]!.id;
    s.at('pkg-move', 'translate', h.start, hopDur, s.offset(at(0), from), s.offset(at(0), to), travelEase);
    s.at('pkg', 'translate', h.start, 0.34, '0 0', `0 ${-30 * k}px`, ease.out);
    s.at('pkg', 'translate', h.start + 0.34, 0.42, `0 ${-30 * k}px`, '0 0', ease.in);
    s.at('pkg', 'scale', h.start + 0.76, 0.12, 1, '1.06 0.9', ease.out);
    s.at('pkg', 'scale', h.start + 0.88, 0.3, '1.06 0.9', 1, ease.settle);
    s.travel(`p-${target}`, h.start + 0.05, 0.7);
    const leave = hops.find(n => n.from === h.to);
    if (!leave) return;
    s.at(`${target}-lit`, 'opacity', h.start + 0.75, 0.1, 0, 1, ease.linear);
    s.at(`${target}-lit`, 'opacity', leave.start + 0.3, 0.6, 1, 0, ease.linear);
  });

  [0, 1, 2].forEach(j => {
    s.at(`dot-${j}-on`, 'opacity', 3.55 + j * 0.22, 0.12, 0, 1, ease.linear);
    s.at(`dot-${j}-on`, 'opacity', 4.7, 0.5, 1, 0, ease.linear);
  });

  s.at('prod-ok', 'opacity', 5.45, 0.35, 0, 1, ease.linear);
  s.at('prod-ok', 'opacity', 7.0, 0.5, 1, 0, ease.linear);
  s.at('live', 'opacity', 5.6, 0.3, 0, 1, ease.out);
  s.at('live', 'translate', 5.6, 0.45, '-8px 0', '0 0', ease.out);
  s.at('live', 'opacity', 7.0, 0.35, 1, 0, ease.linear);

  s.at('pkg', 'opacity', 6.5, 0.35, 1, 0, ease.linear);
  s.set('pkg-move', 'translate', 7.05, '0 0');
  s.dropAt('pkg', 7.2);
  return s;
}

export const example: Example = {
  slug: 'ci-deploy',
  title: 'Commit to production',
  story: 'A commit is packaged by the build, passes its tests and lands on production.',
  prompt: 'Draw a CI pipeline as a short chain: a commit becomes a package that hops through build and test, each stage lighting up, and lands on production with a green live check.',
  level: 'simple',
  category: 'infra',
  layout: 'wide',
  useCase: 'CI/CD',
  surface: 'light',
  interaction: 'watch',
  art: art(build('deploy-sm', 390, 380, [186, 180], 0.72, false), build('deploy-lg', 720, 400, [320, 200], 0.9, true), 520),
};

export default page(example);
