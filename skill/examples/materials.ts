import { finishCategories, type Finish, type FinishCategory } from './materials-kit';
import { generative } from './materials-generative';
import { glass } from './materials-glass';
import { metal } from './materials-metal';
import { natural } from './materials-natural';
import { retro } from './materials-retro';
import { tech } from './materials-tech';

export { finishCategories, type Finish, type FinishCategory };

export const finishes: readonly Finish[] = [...metal, ...glass, ...natural, ...tech, ...retro, ...generative];
