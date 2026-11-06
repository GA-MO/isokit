import { mount } from '../../../skill/lib/runtime';

const cache = new Map<string, Promise<string>>();

function load(name: string): Promise<string> {
  let markup = cache.get(name);
  if (!markup) {
    markup = fetch(`${import.meta.env.BASE_URL}scenes/${name}.html`).then(r => {
      if (!r.ok) throw new Error(`scene ${name}: HTTP ${r.status}`);
      return r.text();
    });
    markup.catch(() => cache.delete(name));
    cache.set(name, markup);
  }
  return markup;
}

function pick(box: HTMLElement): string {
  const { compact, wide, breakpoint } = box.dataset;
  if (!compact) throw new Error('art: a [data-art] box has no data-compact scene');
  return wide && box.getBoundingClientRect().width >= Number(breakpoint) + 1 ? wide : compact;
}

function unmount(box: HTMLElement) {
  for (const old of box.querySelectorAll<HTMLElement>('.iso')) old.iso?.destroy();
}

function failed(box: HTMLElement) {
  const note = document.createElement('p');
  note.className = 'flex items-center gap-3 text-sm text-surface-muted';
  note.textContent = 'This scene did not load.';
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.className = 'font-medium text-surface-ink underline underline-offset-4';
  retry.textContent = 'Retry';
  retry.addEventListener('click', () => show(box));
  note.append(retry);
  unmount(box);
  delete box.dataset.shown;
  box.replaceChildren(note);
}

async function show(box: HTMLElement) {
  if (!box.clientWidth) return;
  const name = pick(box);
  if (box.dataset.loading === name) return;
  if (box.dataset.shown === name) {
    delete box.dataset.loading;
    return;
  }
  box.dataset.loading = name;
  let markup: string;
  try {
    markup = await load(name);
  } catch (e) {
    if (box.dataset.loading !== name) return;
    delete box.dataset.loading;
    console.error(e);
    if (!box.dataset.shown) failed(box);
    return;
  }
  if (box.dataset.loading !== name) return;
  delete box.dataset.loading;
  const template = document.createElement('template');
  template.innerHTML = markup;
  unmount(box);
  box.replaceChildren(template.content);
  try {
    const root = box.querySelector<HTMLElement>('.iso');
    if (!root) throw new Error(`scene ${name}: no .iso root in its markup`);
    mount(root);
    box.dataset.shown = name;
  } catch (e) {
    console.error(e);
    failed(box);
  }
}

export function mountArts(scope: ParentNode = document) {
  const boxes = [...scope.querySelectorAll<HTMLElement>('[data-art]')];
  const near = new IntersectionObserver(
    entries => {
      for (const e of entries) if (e.isIntersecting && e.target instanceof HTMLElement) show(e.target);
    },
    { rootMargin: '75% 0px' },
  );
  const resized = new ResizeObserver(entries => {
    for (const e of entries) if (e.target instanceof HTMLElement && (e.target.dataset.shown || e.target.dataset.loading)) show(e.target);
  });
  for (const box of boxes) {
    near.observe(box);
    if (box.dataset.wide) resized.observe(box);
  }
}
