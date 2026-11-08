import { Scene, ease, type Vec2, type Vec3 } from '../lib/iso';
import { art, fitX, fonts, narrowest, page, surfaces, type Example } from './shared';

const ui = surfaces.dark;
const accent = '#38bdf8';
const lit = 'rgb(56 189 248 / .14)';
const world = "'Inter Variable', 'Inter', 'Noto Sans Thai', 'Thonburi', 'Leelawadee UI', 'Hiragino Sans', 'Noto Sans JP', 'Yu Gothic', system-ui, sans-serif";

const source = 'Your order has shipped';
const targets = [
  { code: 'TH', lang: 'th', text: 'คำสั่งซื้อของคุณจัดส่งแล้ว', em: 0.5 },
  { code: 'JA', lang: 'ja', text: 'ご注文の商品を発送しました', em: 1 },
  { code: 'ES', lang: 'es', text: 'Tu pedido ha sido enviado', em: 0.56 },
  { code: 'DE', lang: 'de', text: 'Ihre Bestellung wurde versandt', em: 0.56 },
  { code: 'FR', lang: 'fr', text: 'Votre commande a été expédiée', em: 0.56 },
  { code: 'PT', lang: 'pt', text: 'Seu pedido foi enviado', em: 0.56 },
] as const;

interface Layout {
  width: number;
  height: number;
  source: Vec2;
  sourceSize: readonly [number, number];
  column: Vec2;
  pitch: number;
}

function build(name: string, l: Layout) {
  const s = new Scene({ name, width: l.width, height: l.height, origin: [l.width / 2, l.height / 2], font: world, mono: fonts.mono, label: ui.label });
  const minPx = l.width > 500 ? 521 : narrowest;
  const [SW, SH] = l.sourceSize;
  const [TW, TH] = [44, 30];
  const t = 6;
  const stand = (screen: Vec2, h: number): Vec3 => {
    const g = s.unproject(screen, 0);
    return [g[0], g[1], h / 2];
  };
  const srcAt = stand(l.source, SH);
  const tgtAt = targets.map((_, i) => stand([l.column[0], l.column[1] + i * l.pitch], TH));
  const plane = (at: Vec3) => s.planeTransform(at, 'left');
  const rect = (w: number, h: number, r: number, extra: string) => `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${r}" ${extra}/>`;

  const shade = (id: string, at: Vec3, w: number) =>
    s.svg(id, `<g filter="${s.blur(5)}">${s.plane([at[0], at[1] + 5, 0], `<rect x="${-w / 2}" y="-8" width="${w}" height="16" rx="8" fill="rgb(0 0 0 / .45)"/>`)}</g>`);
  shade('src-shade', srcAt, SW);
  tgtAt.forEach((at, i) => shade(`t${i}-shade`, at, TW));

  const srcContent =
    `<text x="${-SW / 2 + 12}" y="${-SH / 2 + 16}" font-size="11" fill="#e0f2fe" dominant-baseline="central" style="font-family:var(--iso-mono)">EN</text>` +
    [0, 1, 2].map(i => `<rect x="${-SW / 2 + 12}" y="${-SH / 2 + 32 + i * 11}" width="${(SW - 24) * [0.9, 0.7, 0.45][i]!}" height="4" rx="2" fill="rgb(255 255 255 / .16)"/>`).join('');
  s.panel({ id: 'src', at: srcAt, size: [SW, SH], thickness: 9, facing: 'left', radius: 12, front: ui.top, side: '#075985', edge: 'rgb(125 211 252 / .4)', content: srcContent });
  s.svg('src-glow', `<g transform="${plane(srcAt)}">${rect(SW, SH, 12, `fill="${lit}" stroke="${accent}" stroke-width="1" vector-effect="non-scaling-stroke"`)}</g>`);

  targets.forEach((tg, i) => {
    const content = `<text x="${-TW / 2 + 8}" y="${-TH / 2 + 10}" font-size="10" fill="#a1a1aa" dominant-baseline="central" style="font-family:var(--iso-mono)">${tg.code}</text><rect x="${-TW / 2 + 8}" y="${TH / 2 - 10}" width="${TW - 16}" height="3" rx="1.5" fill="rgb(255 255 255 / .16)"/>`;
    s.panel({ id: `t${i}`, at: tgtAt[i]!, size: [TW, TH], thickness: t, facing: 'left', radius: 7, front: ui.top, side: '#2a2b33', edge: ui.edge, content });
    s.svg(`t${i}-lit`, `<g transform="${plane(tgtAt[i]!)}">${rect(TW, TH, 7, `fill="${lit}" stroke="${accent}" stroke-width="1" vector-effect="non-scaling-stroke"`)}<text x="${-TW / 2 + 8}" y="${-TH / 2 + 10}" font-size="10" fill="#e0f2fe" dominant-baseline="central" style="font-family:var(--iso-mono)">${tg.code}</text></g>`);
  });
  tgtAt.forEach((at, i) => s.svg(`sheet-${i}`, `<g transform="${plane(srcAt)}">${rect(TW, TH, 7, `fill="rgb(56 189 248 / .18)" stroke="${accent}" stroke-width="1" vector-effect="non-scaling-stroke"`)}</g>`));

  const span = (lang: string, text: string) => `<span lang="${lang}" style="font-family:var(--iso-font)">${text}</span>`;
  const srcTop = s.project([srcAt[0], srcAt[1], SH]);
  const srcHigh = s.project([srcAt[0] - SW / 2, srcAt[1], SH])[1];
  s.label({ id: 'src-text', at: { screen: [fitX(srcTop[0], source, l.width, minPx, 'center', 'sans'), srcHigh - 12] }, html: span('en', source), size: 13, anchor: 'bottom' });
  targets.forEach((tg, i) => {
    const [x, y] = s.project([tgtAt[i]![0] + TW / 2, tgtAt[i]![1], TH / 2]);
    const room = 'x'.repeat(Math.ceil([...tg.text].length * (tg.em / 0.56)));
    s.label({ id: `t${i}-text`, at: { screen: [fitX(x + 9, room, l.width, minPx, 'left', 'sans'), y] }, html: span(tg.lang, tg.text), size: 13, anchor: 'left' });
  });

  s.intro('src-shade', 'opacity', 0.1, 0.4, 0, 1, ease.linear);
  s.intro('src', 'opacity', 0.1, 0.12, 0, 1, ease.linear);
  s.intro('src', 'translate', 0.1, 0.5, '0 20px', '0 0', ease.out);
  s.intro('src-text', 'opacity', 0.4, 0.3, 0, 1, ease.out);
  targets.forEach((_, i) => {
    const t0 = 0.3 + i * 0.083;
    s.intro(`t${i}-shade`, 'opacity', t0, 0.3, 0, 1, ease.linear);
    s.dropIn(`t${i}`, t0);
  });

  const L = 10;
  const out = 8.3;
  s.loop(L, 6);
  s.at('src-glow', 'opacity', 0.2, 0.1, 0, 1, ease.linear);
  s.at('src-glow', 'opacity', out + 0.35, 0.5, 1, 0, ease.linear);
  targets.forEach((_, i) => {
    const go = 0.6 + i * 0.3;
    const travel = 0.9;
    const land = go + travel;
    s.at(`sheet-${i}`, 'opacity', go, 0.1, 0, 1, ease.linear);
    s.at(`sheet-${i}`, 'translate', go, travel, '0 0', s.offset(srcAt, tgtAt[i]!), ease.linear);
    s.at(`sheet-${i}`, 'opacity', land, 0.15, 1, 0, ease.linear);
    s.set(`sheet-${i}`, 'translate', land + 0.2, '0 0');
    s.at(`t${i}-lit`, 'opacity', land, 0.1, 0, 1, ease.linear);
    s.at(`t${i}-lit`, 'opacity', out + i * 0.05, 0.5, 1, 0, ease.linear);
    s.at(`t${i}-text`, 'opacity', land + 0.05, 0.3, 0, 1, ease.out);
    s.at(`t${i}-text`, 'translate', land + 0.05, 0.45, '-6px 0', '0 0', ease.out);
    s.at(`t${i}-text`, 'opacity', out + i * 0.05, 0.4, 1, 0, ease.linear);
  });
  return s;
}

export const example: Example = {
  slug: 'translate-six',
  title: 'One message, six languages',
  ask: 'Show one message going out in six languages.',
  story: 'An English message panel sends a copy to six panels, and each one lights up with the message in its own language.',
  prompt: 'Draw one English message panel, "Your order has shipped", fanning out into six panels that show it translated into Thai, Japanese, Spanish, German, French and Portuguese.',
  level: 'medium',
  intent: 'flow',
  layout: 'panels',
  useCase: 'Localization',
  surface: 'dark',
  interaction: 'watch',
  art: art(
    build('translate-sm', { width: 390, height: 490, source: [160, 168], sourceSize: [112, 76], column: [42, 228], pitch: 46 }),
    build('translate-lg', { width: 720, height: 410, source: [196, 270], sourceSize: [136, 92], column: [340, 112], pitch: 48 }),
    520,
  ),
};

export default page(example);
