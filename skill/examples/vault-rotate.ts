import { Scene, ease, type Vec3 } from '../lib/iso.ts';
import { art, fitX, fonts, page, paints, ramps, surfaces, nightFloor, type Example } from './shared.ts';

const ui = surfaces.night;
const gold = ramps.amber;
const accent = '#fbbf24';
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const pull = 'cubic-bezier(.41,.27,.05,.79)';
const shift = 'cubic-bezier(.49,.19,.28,.81)';

const services = [
  { id: 'api', y: -120 },
  { id: 'worker', y: 0 },
  { id: 'billing', y: 120 },
] as const;

const pickup = 1.5;
const revoke = 3.9;
const promote = 4.9;
const reset = 8.95;

function keyGlyph(k: number, color: string) {
  const r = 5.5 * k;
  return `<g fill="none" stroke="${color}" stroke-width="${2.2 * k}" stroke-linecap="round"><circle cx="${-8 * k}" cy="0" r="${r}"/><path d="M${-8 * k + r} 0H${12 * k}M${7 * k} 0V${4.5 * k}M${11 * k} 0V${3.5 * k}"/></g>`;
}

function build(name: string, width: number, height: number, origin: readonly [number, number], k: number, wide: boolean) {
  const s = new Scene({ name, width, height, origin, font: fonts.sans, mono: fonts.mono, label: ui.label });
  const vault: Vec3 = [-140 * k, 0, 0];
  const vaultSize = 136 * k;
  const vaultH = 58 * k;
  const keySize = 46 * k;
  const keyH = 8 * k;
  const slotA: Vec3 = [vault[0], -32 * k, keyH];
  const slotB: Vec3 = [vault[0], 32 * k, keyH];
  const chSize = 84 * k;
  const chX = 110 * k;
  const z = -14 * k;

  const pitch = 18 * k;
  const span = 620 * k;
  nightFloor(s, [-20 * k, 0, -vaultH], span, pitch);
  const halo = s.def('halo-fill', '<radialGradient id="$ID"><stop offset=".3" stop-color="#fcd34d" stop-opacity=".55"/><stop offset=".6" stop-color="#fbbf24" stop-opacity=".18"/><stop offset="1" stop-color="#fbbf24" stop-opacity="0"/></radialGradient>');
  s.face({ id: 'halo', at: [vault[0], vault[1], -vaultH], size: [vaultSize * 1.8, vaultSize * 1.8], radius: vaultSize * 0.9, fill: halo });

  services.forEach(c => {
    const y = c.y * k;
    const from = vault[0] + vaultSize / 2;
    const points: Vec3[] = y === 0 ? [[from, 0, z], [chX - chSize / 2, 0, z]] : [[from, 0, z], [-14 * k, 0, z], [-14 * k, y, z], [chX - chSize / 2, y, z]];
    s.wire({ id: `w-${c.id}`, points, stroke: ui.wire, width: 1.25 });
    s.pulse({ id: `p-${c.id}`, wire: `w-${c.id}`, color: accent, length: 0.14 });
  });

  s.group('vault-g', () => {
    s.slab({ id: 'vault', at: vault, size: [vaultSize, vaultSize], height: vaultH, radius: 22 * k, top: '#2f2a55', side: paints.gradient(s, gold), grain: 0.06, edge: 'rgb(253 230 138 / .45)' });
    s.face({ id: 'vault-glow', at: vault, size: [vaultSize, vaultSize], radius: 22 * k, fill: 'rgb(251 191 36 / .2)' });
    s.text({ id: 'vault-name', at: [vault[0], vault[1] + vaultSize / 2, -vaultH * 0.5], text: 'vault', size: 12, color: '#fffbeb', on: 'left', anchor: 'middle' });
    [slotA, slotB].forEach((at, i) => s.face({ id: `slot-${i}`, at: [at[0], at[1], 0], size: [keySize, keySize], radius: 9 * k, stroke: 'rgb(253 230 138 / .35)', dash: '4 4' }));
  });
  s.march('slot-0', 4, 4, 24);
  s.march('slot-1', 4, 4, 24);

  const key = (id: string, at: Vec3) =>
    s.group(id, () => {
      s.slab({ id: `${id}-slab`, at, size: [keySize, keySize], height: keyH, radius: 9 * k, top: '#3a2c4a', side: paints.gradient(s, gold), grain: 0.06, edge: 'rgb(253 230 138 / .5)' });
      s.svg(`${id}-mark`, s.plane(at, keyGlyph(k, accent)));
    });
  key('key-new', slotB);
  key('key-old', slotA);

  services.forEach(c => {
    const at: Vec3 = [chX, c.y * k, 0];
    s.group(c.id, () => {
      s.slab({ id: `${c.id}-slab`, at, size: [chSize, chSize], height: 20 * k, radius: 14 * k, top: ui.top, side: paints.brushed(s, ramps.steel), grain: 0.06, edge: ui.edge });
      s.face({ id: `${c.id}-hit`, at, size: [chSize, chSize], radius: 14 * k, fill: 'rgb(252 211 77 / .1)', stroke: accent, strokeWidth: 1.5 });
      const chip: Vec3 = [at[0] - 8 * k, at[1], 0];
      s.svg(`${c.id}-chip`, s.plane(chip, keyGlyph(k * 0.8, '#5b64a8')));
      s.svg(`${c.id}-chip-on`, s.plane(chip, keyGlyph(k * 0.8, accent)));
      s.text({ id: `${c.id}-name`, at: [at[0] + chSize / 2 - 13 * k, at[1], 0], text: c.id, size: wide ? 11 : 10, color: ui.muted, on: 'top', along: 'y', anchor: 'middle' });
    });
    if (wide) {
      const [x, y] = s.project([chX + chSize / 2 + 18, c.y * k - 18, 0]);
      const text = `${c.id} · v9`;
      s.label({ id: `${c.id}-v`, at: { screen: [fitX(x, text, width, 521, 'left'), y] }, html: `${c.id} <span style="color:${accent}">· v9</span>`, size: 13, anchor: 'left' });
    }
  });

  const top = s.project([vault[0], 0, 0]);
  const tag = 'key v8 → v9';
  s.label({ id: 'rotate', at: { screen: [fitX(top[0], tag, width, wide ? 521 : 300), top[1] - vaultSize * 0.42 - 12 * k] }, html: `key <span style="color:${ui.muted}">v8 →</span> <span style="color:${accent}">v9</span>`, size: 13, anchor: 'bottom' });

  s.dropIn('vault-g', 0.1);
  s.dropIn('key-old', 0.45, 30 * k);
  services.forEach((c, i) => s.dropIn(c.id, 0.3 + i * 0.083));

  s.loop(9, 3.4);
  s.dropAt('key-new', 0.4, 40 * k);
  s.at('vault-glow', 'opacity', 0.75, 0.1, 0, 1, ease.linear);
  s.at('vault-glow', 'opacity', 0.85, 0.6, 1, 0, ease.linear);
  s.at('rotate', 'opacity', 0.7, 0.3, 0, 1, ease.out);
  s.at('rotate', 'translate', 0.7, 0.4, '0 8px', '0 0', ease.out);

  services.forEach((c, i) => {
    const start = pickup + i * 0.08;
    const dur = Math.max(0.3, s.wireLength(`w-${c.id}`) / 270);
    const arrive = start + dur;
    s.travel(`p-${c.id}`, start, dur);
    s.at(`${c.id}-hit`, 'opacity', arrive, 0.1, 0, 1, ease.linear);
    s.at(`${c.id}-hit`, 'opacity', arrive + 0.1, 0.6, 1, 0, ease.linear);
    s.at(`${c.id}-chip-on`, 'opacity', arrive, 0.25, 0, 1, ease.linear);
    s.at(`${c.id}-chip-on`, 'opacity', 7.2 + i * 0.08, 0.8, 1, 0, ease.linear);
    s.at(c.id, 'translate', arrive, 0.3, '0 0', '0 -6px', pull);
    s.at(c.id, 'translate', arrive + 0.3, 0.74, '0 -6px', '0 0', settle);
    if (wide) {
      s.at(`${c.id}-v`, 'opacity', arrive + 0.05, 0.25, 0, 1, ease.out);
      s.at(`${c.id}-v`, 'translate', arrive + 0.05, 0.4, '-8px 0', '0 0', ease.out);
      s.at(`${c.id}-v`, 'opacity', 7.0 + i * 0.08, 0.35, 1, 0, ease.linear);
    }
  });

  s.at('key-old', 'opacity', revoke, 0.6, 1, 0, ease.linear);
  s.at('key-old', 'translate', revoke, 0.6, '0 0', '0 6px', ease.in);
  s.at('key-new', 'translate', promote, 0.82, '0 0', s.offset(slotB, slotA), shift);
  s.at('rotate', 'opacity', 6.6, 0.35, 1, 0, ease.linear);

  s.set('key-new', 'opacity', reset, 0);
  s.set('key-new', 'translate', reset, '0 0');
  s.set('key-old', 'opacity', reset, 1);
  s.set('key-old', 'translate', reset, '0 0');
  return s;
}

export const example: Example = {
  slug: 'vault-rotate',
  title: 'Key rotation',
  ask: 'Show a key rotated without downtime.',
  story: 'A new key lands in the vault beside the old one, every service picks it up, then the old key is revoked and the new one takes its place.',
  prompt: 'Draw a secrets vault rotating its key: a new key slides in beside the old one, pulses carry it to three services, then the old key fades out and the new one moves into its slot.',
  level: 'medium',
  intent: 'change',
  layout: 'radial',
  useCase: 'Secrets',
  surface: 'night',
  interaction: 'watch',
  art: art(build('vault-sm', 390, 400, [200, 206], 0.76, false), build('vault-lg', 720, 400, [334, 212], 1, true), 520),
};

export default page(example);
