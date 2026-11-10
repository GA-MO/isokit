import { finishCategories, type Finish, type FinishCategory } from './materials-kit.ts';
import { generative } from './materials-generative.ts';
import { glass } from './materials-glass.ts';
import { metal } from './materials-metal.ts';
import { natural } from './materials-natural.ts';
import { retro } from './materials-retro.ts';
import { tech } from './materials-tech.ts';

export { finishCategories, type Finish, type FinishCategory };

export const finishes: readonly Finish[] = [...metal, ...glass, ...natural, ...tech, ...retro, ...generative];
