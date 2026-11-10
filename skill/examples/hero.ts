import { build } from './hero/build.ts';
import { device } from './hero/device.ts';
import { orders } from './hero/orders.ts';
import { payment } from './hero/payment.ts';
import { reel, stageArt, storyArt, ui, type Story, type Variant } from './hero/stage.ts';
import { page, type Art } from './shared.ts';

const list: readonly Story[] = [orders, device, payment, build];

export const stories = list.map(story => ({ ...story, art: storyArt(story) }));
export const stage: Art = stageArt();

const title = 'Four sentences typed to Claude become four animated diagrams: an API that scales, a device taken apart, a payment round trip and a faster build';
export const readme = (v: Variant) => reel(list, v, title);

const preview: Art = stories[0]!.art;

export default { ...page({ title: 'Hero, first story', surface: 'light', art: preview }), background: ui.page };
