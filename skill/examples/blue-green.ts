import { Scene, ease, type Vec2, type Vec3 } from '../lib/iso.ts';
import { art, fitX, fonts, narrowest, page, paints, ramps, surfaces, type Example } from './shared.ts';

const ui = surfaces.light;
const redraw = 'cubic-bezier(.31,.12,.03,.72)';

const envs = {
  blue: { ramp: ramps.sky, top: '#38bdf8', glow: 'rgb(14 165 233 / .2)', ink: '#075985', pulse: '#0284c7' },
  green: { ramp: ramps.emerald, top: '#34d399', glow: 'rgb(16 185 129 / .2)', ink: '#047857', pulse: '#059669' },
} as const;
type Env = keyof typeof envs;
const names = ['blue', 'green'] as const satisfies readonly Env[];

const half = 6.3;
const releases = [
  { from: 'blue', to: 'green', at: 0, build: '7c2e' },
  { from: 'green', to: 'blue', at: half, build: '9a41' },
] as const satisfies readonly { from: Env; to: Env; at: number; build: string }[];
const retarget = 3.3;
const landed = retarget + 0.2 + 0.26 + 0.34;
const beat = 0.9;

const liveAt = (t: number): Env => (t >= landed && t < half + landed ? 'green' : 'blue');
const quiet = (t: number) => releases.some(r => t > r.at + retarget - 0.5 && t < r.at + landed + 0.1);
const traffic = Array.from({ length: Math.round((2 * half) / beat) }, (_, i) => 0.5 + i * beat).filter(t => !quiet(t) && t + 1.2 <= 2 * half);

type Layout = {
  name: string;
  width: number;
  height: number;
  origin: Vec2;
  k: number;
  reach: number;
  dirs: Record<Env, Vec2>;
  note: (s: Scene, env: Vec3, size: number, text: string) => { at: { screen: Vec2 }; anchor: 'left' | 'top' };
};

function build({ name, width, height, origin, k, reach, dirs, note }: Layout) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const router = 84 * k;
  const size = 104 * k;
  const d = reach * k;
  const wz = -8 * k;
  const buildSize = 34 * k;
  const buildH = 12 * k;
  const print = width > 520 ? 13 : 11;
  const at = (env: Env, along = d, z = 0): Vec3 => [dirs[env][0] * along, dirs[env][1] * along, z];

  names.forEach(env => {
    s.wire({ id: `w-${env}`, points: [at(env, router / 2, wz), at(env, d - size / 2, wz)], stroke: ui.wire, width: 1.25, hidden: true });
    s.pulse({ id: `p-${env}`, wire: `w-${env}`, color: envs[env].pulse, length: 0.2 });
  });

  s.slab({ id: 'router', at: [0, 0, 0], size: [router, router], height: 28 * k, radius: 16 * k, top: ui.top, side: paints.brushed(s, ramps.silver), grain: 0.06, edge: ui.edge });
  s.text({ id: 'router-name', at: [0, 0, 0], text: 'router', size: print, color: '#52525b', on: 'top', anchor: 'middle' });

  names.forEach(env => {
    const c = envs[env];
    const top = at(env);
    s.group(`${env}-env`, () => {
      s.slab({ id: env, at: top, size: [size, size], height: 26 * k, radius: 18 * k, top: ui.top, side: paints.gradient(s, c.ramp), grain: 0.06, edge: ui.edge });
      s.slab({ id: `${env}-idle`, at: top, size: [size, size], height: 26 * k, radius: 18 * k, top: ui.top, side: paints.brushed(s, ramps.silver), grain: 0.06, edge: ui.edge, shadow: false });
      s.face({ id: `${env}-lit`, at: top, size: [size, size], radius: 18 * k, fill: c.glow });
      s.face({ id: `${env}-hit`, at: top, size: [size, size], radius: 18 * k, fill: c.glow });
      [-1, 0, 1].forEach(i => {
        const p: Vec3 = [top[0] + i * 17 * k - 6 * k, top[1] + 34 * k, 0];
        s.face({ id: `${env}-dot-${i + 2}`, at: p, size: [9 * k, 9 * k], radius: 4.5 * k, fill: 'rgb(22 23 27 / .1)' });
        s.face({ id: `${env}-on-${i + 2}`, at: p, size: [9 * k, 9 * k], radius: 4.5 * k, fill: c.pulse });
      });
      s.text({ id: `${env}-name`, at: [top[0] + size / 2 - 12 * k, top[1], 0], text: env, size: print + 1, color: c.ink, on: 'top', along: 'y', anchor: 'middle' });
    });
  });

  names.forEach(env => s.slab({ id: `build-${env}`, at: at(env, d, buildH), size: [buildSize, buildSize], height: buildH, radius: 8 * k, top: envs[env].top, side: paints.flat(envs[env].ramp[1]), edge: 'rgb(255 255 255 / .45)', shadow: false }));

  const [rx, ry] = s.project([0, 0, 0]);
  names.forEach(env => s.label({ id: `live-${env}`, at: { screen: [rx, ry - 0.41 * router - 14] }, html: `live <span style="color:${envs[env].ink}">→ ${env}</span>`, size: 13, anchor: 'bottom' }));
  releases.forEach(r => {
    const text = `deploy ${r.build}`;
    const n = note(s, at(r.to), size, text);
    s.label({ id: `note-${r.to}`, at: n.at, text, size: 13, anchor: n.anchor });
  });

  s.dropIn('router', 0.1);
  s.intro('router-name', 'opacity', 0.1, 0.3, 0, 1, ease.out);
  names.forEach((env, i) => s.dropIn(`${env}-env`, 0.25 + i * 0.083));
  s.intro('live-blue', 'opacity', 0.6, 0.3, 0, 1, ease.out);
  s.intro('live-blue', 'translate', 0.6, 0.4, '0 8px', '0 0', ease.out);
  s.introUntil(0.8);

  s.loop(2 * half, landed + 0.65);

  traffic.forEach(t => {
    const env = liveAt(t);
    const dur = Math.max(0.3, s.wireLength(`w-${env}`) / 270);
    s.travel(`p-${env}`, t, dur);
    s.at(`${env}-hit`, 'opacity', t + dur, 0.1, 0, 0.7, ease.linear);
    s.at(`${env}-hit`, 'opacity', t + dur + 0.1, 0.6, 0.7, 0, ease.linear);
  });

  releases.forEach(({ from, to, at: b }) => {
    s.dropAt(`build-${to}`, b + 0.6, 40 * k);
    s.at(`${to}-lit`, 'opacity', b + 0.92, 0.1, 0, 1, ease.linear);
    s.at(`${to}-lit`, 'opacity', b + 1.02, 0.6, 1, 0, ease.linear);
    s.at(`note-${to}`, 'opacity', b + 0.85, 0.3, 0, 1, ease.out);
    s.at(`note-${to}`, 'translate', b + 0.85, 0.4, '0 6px', '0 0', ease.out);

    s.at(`${to}-idle`, 'opacity', b + 1.1, 1.6, 1, 0.55, ease.linear);
    [1, 2, 3].forEach(i => s.at(`${to}-on-${i}`, 'opacity', b + 1.2 + (i - 1) * 0.4, 0.23, 0, 1, ease.linear));

    s.retract(`w-${from}`, b + retarget, 0.2, 'start', ease.in);
    s.at(`live-${from}`, 'opacity', b + retarget, 0.25, 1, 0, ease.linear);
    s.draw(`w-${to}`, b + retarget + 0.46, 0.34, redraw);
    s.at(`live-${to}`, 'opacity', b + retarget + 0.55, 0.3, 0, 1, ease.out);
    s.tug(`${to}-env`, b + landed, s.offset(at(to), at(to, d - 7 * k)));
    s.at(`${to}-lit`, 'opacity', b + landed, 0.1, 0, 1, ease.linear);
    s.at(`${to}-lit`, 'opacity', b + landed + 0.1, 0.6, 1, 0, ease.linear);
    s.at(`${to}-idle`, 'opacity', b + landed, 0.4, 0.55, 0, ease.linear);
    s.at(`${from}-idle`, 'opacity', b + landed + 0.1, 0.6, 0, 1, ease.linear);

    const clear = b + landed + 0.8;
    s.at(`build-${to}`, 'opacity', clear, 0.4, 1, 0, ease.linear);
    [1, 2, 3].forEach(i => s.at(`${to}-on-${i}`, 'opacity', clear, 0.4, 1, 0, ease.linear));
    s.at(`note-${to}`, 'opacity', clear, 0.3, 1, 0, ease.linear);
  });
  return s;
}

export const example: Example = {
  slug: 'blue-green',
  title: 'Blue-green release',
  ask: 'Show traffic switching from blue to green.',
  story: 'A new build lands on the idle environment and warms up, then the router re-targets its wire so traffic flows there and the old side goes idle.',
  prompt: 'Draw a blue-green deployment: a router sending traffic to the live blue environment, a new build warming up on green, then the router switching its wire to green while blue goes idle.',
  level: 'medium',
  intent: 'change',
  layout: 'diagonal',
  useCase: 'Release',
  surface: 'light',
  interaction: 'watch',
  art: art(
    build({
      name: 'bluegreen-sm',
      width: 390,
      height: 380,
      origin: [195, 132],
      k: 0.85,
      reach: 190,
      dirs: { blue: [0, 1], green: [1, 0] },
      note: (s, env, size, text) => {
        const [x, y] = s.project(env);
        return { at: { screen: [fitX(x, text, 390, narrowest), y + 0.41 * size + 40] }, anchor: 'top' };
      },
    }),
    build({
      name: 'bluegreen-lg',
      width: 720,
      height: 400,
      origin: [204, 198],
      k: 1.1,
      reach: 250,
      dirs: { blue: [0, -1], green: [1, 0] },
      note: (s, env, size, text) => {
        const [x, y] = s.project(env);
        return { at: { screen: [fitX(x + 0.71 * size + 18, text, 720, 521, 'left'), y] }, anchor: 'left' };
      },
    }),
    520,
  ),
};

export default page(example);
