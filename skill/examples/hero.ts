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

const preview: Art = stories[0]!.art;

export default { ...page({ title: 'Hero, first story', surface: 'light', art: preview }), background: ui.page };
