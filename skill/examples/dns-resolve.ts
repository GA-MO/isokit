import { Scene, ease, type Material, type Vec3 } from '../lib/iso';
import { art, fitX, fonts, page, paints, ramps, surfaces, type Example, narrowest } from './shared';

const ui = surfaces.light;
const accent = '#4f46e5';
const referral = '#a1a1aa';
const answer = '#059669';
const line = 'rgb(22 23 27 / .16)';
const tint = 'rgb(99 102 241 / .16)';

const servers = [
  { id: 'root', y: -120 },
  { id: 'tld', y: 0 },
  { id: 'auth', y: 120 },
] as const;
const query = 'app.example.dev';
const ip = '203.0.113.7';

function build(name: string, width: number, height: number, origin: readonly [number, number], k: number, minPx: number) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const client: Vec3 = [-270 * k, 0, 0];
  const resolver: Vec3 = [-80 * k, 0, 0];
  const serverX = 140 * k;
  const clientSize = 70 * k;
  const resolverSize = 100 * k;
  const serverSize = 76 * k;
  const z = -8 * k;
  const serverAt = (i: number): Vec3 => [serverX, servers[i]!.y * k, 0];
  const route = (id: string, color: string, points: readonly Vec3[]) => {
    s.wire({ id, points, stroke: ui.wire, width: 1.25 });
    s.wire({ id: `${id}-back`, points: [...points].reverse(), stroke: 'transparent' });
    s.pulse({ id: `${id}-q`, wire: id, color: accent, length: 0.18 });
    s.pulse({ id: `${id}-r`, wire: `${id}-back`, color, length: 0.18 });
  };
  route('w-client', answer, [[client[0] + clientSize / 2, 0, z], [resolver[0] - resolverSize / 2, 0, z]]);
  servers.forEach((sv, i) => {
    const y = sv.y * k;
    const from = resolver[0] + resolverSize / 2;
    const to = serverX - serverSize / 2;
    const bend = 46 * k;
    route(`w-${sv.id}`, sv.id === 'auth' ? answer : referral, y === 0 ? [[from, 0, z], [to, 0, z]] : [[from, 0, z], [bend, 0, z], [bend, y, z], [to, y, z]]);
  });

  const tile = (id: string, at: Vec3, size: number, h: number, side: Material, label: string, color: string = ui.muted) =>
    s.group(id, () => {
      s.slab({ id: `${id}-slab`, at, size: [size, size], height: h, radius: size * 0.18, top: ui.top, side, grain: 0.05, edge: ui.edge, outline: line, shade: false });
      s.face({ id: `${id}-lit`, at, size: [size, size], radius: size * 0.18, fill: tint });
      s.text({ id: `${id}-name`, at: [at[0] + size / 2 - 12 * k, at[1], 0], text: label, size: 11, color, on: 'top', along: 'y', anchor: 'middle' });
    });
  tile('client', client, clientSize, 18 * k, paints.flat('#f4f4f5'), 'client');
  tile('resolver', resolver, resolverSize, 28 * k, paints.dots(s, ramps.indigo, 4), 'resolver', accent);
  servers.forEach((sv, i) => tile(sv.id, serverAt(i), serverSize, 20 * k, paints.brushed(s, ramps.silver), sv.id));

  const [cx, cy] = s.project(client);
  s.label({ id: 'ask', at: { screen: [fitX(cx, query, width, minPx), cy - 98 * k] }, text: query, size: 13, anchor: 'bottom' });
  s.label({ id: 'ip', at: { screen: [fitX(cx, `✓ ${ip}`, width, minPx), cy - 46 * k] }, html: `<span style="color:${answer}">✓</span> ${ip}`, size: 13, anchor: 'bottom' });

  s.dropIn('client', 0.1);
  s.dropIn('resolver', 0.18);
  servers.forEach((sv, i) => s.dropIn(sv.id, 0.3 + i * 0.083));

  const dur = (wire: string) => (wire === 'w-root' || wire === 'w-auth' ? 0.75 : 0.55);
  const on = (id: string, t: number) => s.at(`${id}-lit`, 'opacity', t, 0.15, 0, 1, ease.linear);
  const off = (id: string, t: number) => s.at(`${id}-lit`, 'opacity', t, 0.5, 1, 0, ease.linear);

  let t = 0.2;
  s.at('ask', 'opacity', t, 0.2, 0, 1, ease.out);
  s.typeIn('ask', t, 0.7, 15);
  on('client', t);
  t += 0.85;
  s.travel('w-client-q', t, dur('w-client'));
  t += dur('w-client');
  on('resolver', t);
  off('client', t);
  t += 0.2;
  servers.forEach(sv => {
    const w = `w-${sv.id}`;
    s.travel(`${w}-q`, t, dur(w));
    t += dur(w);
    on(sv.id, t);
    t += 0.25;
    s.travel(`${w}-r`, t, dur(w));
    off(sv.id, t + 0.1);
    t += dur(w) + 0.2;
  });
  s.travel('w-client-r', t, dur('w-client'));
  off('resolver', t + 0.1);
  t += dur('w-client');
  on('client', t);
  s.at('ip', 'opacity', t, 0.3, 0, 1, ease.out);
  s.at('ip', 'translate', t, 0.45, '0 6px', '0 0', ease.out);
  const still = Math.round((t + 0.5) * 10) / 10;
  const clear = t + 2.2;
  off('client', clear);
  s.at('ask', 'opacity', clear, 0.35, 1, 0, ease.linear);
  s.set('ask', 'clipPath', clear + 0.4, 'inset(-20% 100% -20% 0)');
  s.at('ip', 'opacity', clear, 0.35, 1, 0, ease.linear);
  s.loop(Math.ceil((clear + 0.8) * 10) / 10, still);
  return s;
}

export const example: Example = {
  slug: 'dns-resolve',
  title: 'DNS resolution',
  story: 'A query for app.example.dev goes to the resolver, which asks the root, the TLD and the authoritative server in turn, and the address comes back to the client.',
  prompt: 'Draw a DNS lookup: a client asks a resolver for app.example.dev, the resolver asks root, TLD and authoritative servers one hop at a time, and the IP address returns to the client.',
  level: 'simple',
  category: 'infra',
  useCase: 'Networking',
  surface: 'light',
  interaction: 'watch',
  art: art(build('dns-sm', 390, 400, [214, 222], 0.68, narrowest), build('dns-lg', 720, 400, [372, 232], 0.88, 521), 520),
};

export default page(example);
