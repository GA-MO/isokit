import { Scene, ease, type Vec3 } from '../lib/iso';
import { art, fonts, page, paints, ramps, surfaces, type Example } from './shared';

const ui = surfaces.dark;
const settle = 'cubic-bezier(.39,.08,.04,.91)';
const popIn = 'linear(0, 0.007 1.5%, 0.033 3.3%, 0.078 5%, 0.14 6.8%, 0.216 8.5%, 0.305 10.3%, 0.709 17.3%, 0.863 20.3%, 0.936 22%, 0.987 23.5%, 1.03 25.3%, 1.052 26.8%, 1.06 28.2%, 1.06 38.3%, 1.015 67.5%, 1)';
const exit = 'linear(0, -0.007 11.8%, -0.045 37.8%, -0.048 57%, -0.028 63.2%, 0.018 69.3%, 0.079 74.3%, 0.164 79.3%, 0.27 84%, 0.392 88.3%, 0.459 90.3%, 0.535 92.3%, 0.609 94%, 0.694 95.8%, 0.777 97.3%, 0.859 98.5%, 0.942 99.5%, 1)';

const lip = 62;
const tall = 112;
const k = Math.tan(Math.PI / 6);
const f = (v: number) => Number(v.toFixed(2));

function bellPath(r: number, h: number): string {
  const ry = r * k;
  const side = (sx: number) =>
    sx < 0
      ? `C${f(-r * 0.84)} ${f(-h * 0.06)} ${f(-r * 0.68)} ${f(-h * 0.2)} ${f(-r * 0.66)} ${f(-h * 0.42)}C${f(-r * 0.64)} ${f(-h * 0.66)} ${f(-r * 0.6)} ${f(-h * 0.86)} ${f(-r * 0.4)} ${f(-h * 0.97)}`
      : `C${f(r * 0.6)} ${f(-h * 0.86)} ${f(r * 0.64)} ${f(-h * 0.66)} ${f(r * 0.66)} ${f(-h * 0.42)}C${f(r * 0.68)} ${f(-h * 0.2)} ${f(r * 0.84)} ${f(-h * 0.06)} ${f(r)} 0`;
  return `M${f(-r)} 0${side(-1)}C${f(-r * 0.22)} ${f(-h * 1.06)} ${f(r * 0.22)} ${f(-h * 1.06)} ${f(r * 0.4)} ${f(-h * 0.97)}${side(1)}A${f(r)} ${f(ry)} 0 0 1 ${f(-r)} 0Z`;
}

function build(name: string) {
  const s = new Scene({ name, width: 390, height: 300, origin: [195, 184], font: fonts.sans, mono: fonts.mono, label: ui.label });
  const lift = 24;
  const [bx, by] = s.project([0, 0, lift]);
  const ry = lip * k;

  const metal = s.def('metal', `<linearGradient id="$ID" x1="0" y1="0" x2="1" y2="0">${[[0, '#78350f'], [0.18, '#b45309'], [0.36, '#fde68a'], [0.5, '#fbbf24'], [0.78, '#b45309'], [1, '#451a03']].map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`);
  const shine = s.def('shine', `<linearGradient id="$ID" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity=".22"/><stop offset=".55" stop-color="#ffffff" stop-opacity="0"/><stop offset="1" stop-color="#000000" stop-opacity=".25"/></linearGradient>`);
  const rimFill = s.def('rim', `<linearGradient id="$ID" x1="0" y1="0" x2="1" y2="0">${[[0, '#92400e'], [0.34, '#fef3c7'], [0.6, '#f59e0b'], [1, '#78350f']].map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`);

  s.slab({ id: 'base', at: [0, 0, 0], size: [236, 236], height: 14, radius: 118, top: ui.top, side: paints.brushed(s, ramps.graphite), grain: 0.06, edge: ui.edge });
  s.face({ id: 'base-glow', at: [0, 0, 0], size: [160, 160], radius: 80, fill: 'rgb(251 191 36 / .16)' });
  s.group('shade', () => s.svg('shade-blur', `<g filter="${s.blur(6)}">${s.plane([0, 0, 0], `<circle r="${lip * 0.8}" fill="rgb(0 0 0 / .55)"/>`)}</g>`));
  [0, 1, 2].forEach(i => s.face({ id: `ring-${i}`, at: [0, 0, 0], size: [lip * 2, lip * 2], radius: lip, stroke: 'rgb(251 191 36 / .9)', strokeWidth: 1.5, ...(i === 1 ? { dash: '5 4' } : {}) }));

  const badge: Vec3 = [20, -58, lift + tall - 6];
  s.group('bell-float', () => {
    s.group('bell', () => {
      s.svg(
        'bell-body',
        `<g transform="translate(${f(bx)} ${f(by)})">` +
          `<circle cx="0" cy="${f(ry + 3)}" r="10" fill="#d97706"/><circle cx="-3" cy="${f(ry + 1)}" r="3.5" fill="#fde68a" opacity=".7"/>` +
          `<path d="${bellPath(lip, tall)}" fill="${metal}"/><path d="${bellPath(lip, tall)}" fill="${shine}"/>` +
          `<path d="M${-lip} 0A${lip} ${f(ry)} 0 0 0 ${lip} 0L${lip - 3} -9A${lip - 3} ${f((lip - 3) * k)} 0 0 1 ${3 - lip} -9Z" fill="${rimFill}"/>` +
          `<path d="M${f(-lip * 0.42)} ${f(-tall * 0.3)}C${f(-lip * 0.44)} ${f(-tall * 0.6)} ${f(-lip * 0.38)} ${f(-tall * 0.8)} ${f(-lip * 0.22)} ${f(-tall * 0.9)}" fill="none" stroke="#fffbeb" stroke-width="4" stroke-linecap="round" opacity=".45" filter="${s.blur(1.5)}"/>` +
          `<circle cx="0" cy="${f(-tall - 6)}" r="7" fill="none" stroke="#f59e0b" stroke-width="4"/>` +
          `</g>`,
      );
    });
    s.group('badge', () => {
      s.slab({ id: 'badge-slab', at: badge, size: [42, 42], height: 9, radius: 21, top: '#e11d48', side: paints.gradient(s, ramps.rose), edge: 'rgb(255 255 255 / .3)', shadow: false });
      const [tx, ty] = s.project(badge);
      s.text({ id: 'badge-count', at: { screen: [tx, ty] }, text: '3', size: 14, weight: 600, font: 'sans', color: '#ffffff', anchor: 'middle' });
    });
  });
  s.pivot('bell', [0, 0, lift + tall + 8]);

  s.dropIn('base', 0.1);
  s.dropIn('bell', 0.25);
  s.ambient('bell-float', 'translate', 4, ['0 0', '0 -5px', '0 0'], ease.io);
  s.ambient('shade', 'opacity', 4, [1, 0.75, 1], ease.io);

  s.loop(6, 2.1);
  s.at('bell', 'rotate', 0.3, 0.24, '0deg', '12deg', ease.out);
  s.at('bell', 'rotate', 0.54, 0.42, '12deg', '-9deg', ease.io);
  s.at('bell', 'rotate', 0.96, 0.9, '-9deg', '0deg', settle);
  s.at('base-glow', 'opacity', 0.4, 0.15, 0, 1, ease.linear);
  s.at('base-glow', 'opacity', 0.55, 1.4, 1, 0, ease.linear);
  [0, 1, 2].forEach(i => {
    const t = 0.42 + i * 0.32;
    s.at(`ring-${i}`, 'opacity', t, 0.1, 0, 1, ease.linear);
    s.at(`ring-${i}`, 'opacity', t + 0.1, 1.5, 1, 0, ease.linear);
    s.at(`ring-${i}`, 'scale', t, 1.6, 1, 1.85, ease.out);
    s.set(`ring-${i}`, 'scale', t + 1.7, 1);
  });
  s.at('badge', 'scale', 1.3, 0.6, 0, 1, popIn);
  s.at('badge', 'scale', 5.0, 0.745, 1, 0, exit);
  return s;
}

export const example: Example = {
  slug: 'bell-ring',
  title: 'Bell ring',
  story: 'A bell rocks once, rings of sound spread across its base and a count badge pops in.',
  prompt: 'Draw a notification bell that rocks once, sends rings out across its base and shows a small count badge.',
  level: 'spot',
  category: 'product',
  useCase: 'Alerts',
  surface: 'dark',
  interaction: 'watch',
  art: art(build('spot-bell')),
};

export default page(example);
