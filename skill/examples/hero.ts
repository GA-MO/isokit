import { build } from './hero/build';
import { device } from './hero/device';
import { orders } from './hero/orders';
import { payment } from './hero/payment';
import { reel, stageArt, storyArt, ui, type Story, type Variant } from './hero/stage';
import { page, type Art } from './shared';

const list: readonly Story[] = [orders, device, payment, build];

export const stories = list.map(story => ({ ...story, art: storyArt(story) }));
export const stage: Art = stageArt();

const title = 'Four sentences typed to Claude become four animated diagrams: an API that scales, a device taken apart, a payment round trip and a faster build';
export const readme = (v: Variant) => reel(list, v, title);

const preview: Art = { ...stage, html: `<div style="display:grid">${[stage, ...stories.map(s => s.art)].map(a => `<div style="grid-area:1/1">${a.html}</div>`).join('')}</div>` };

export default { ...page({ title: 'Four prompts, four scenes', surface: 'light', art: preview }), background: ui.page };
