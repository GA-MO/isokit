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
  return wide && box.clientWidth > Number(breakpoint) ? wide : compact;
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
  box.replaceChildren(note);
}

async function show(box: HTMLElement) {
  if (!box.clientWidth) return;
  const name = pick(box);
  if (box.dataset.shown === name || box.dataset.loading === name) return;
  box.dataset.loading = name;
  try {
    const markup = await load(name);
    if (box.dataset.loading !== name) return;
    const template = document.createElement('template');
    template.innerHTML = markup;
    for (const old of box.querySelectorAll<HTMLElement>('.iso')) old.iso?.destroy();
    box.replaceChildren(template.content);
    const root = box.querySelector<HTMLElement>('.iso');
    if (!root) throw new Error(`scene ${name}: no .iso root in its markup`);
    mount(root);
    box.dataset.shown = name;
  } catch (e) {
    console.error(e);
    delete box.dataset.shown;
    failed(box);
  } finally {
    if (box.dataset.loading === name) delete box.dataset.loading;
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
    for (const e of entries) if (e.target instanceof HTMLElement && e.target.dataset.shown) show(e.target);
  });
  for (const box of boxes) {
    near.observe(box);
    if (box.dataset.wide) resized.observe(box);
  }
}
