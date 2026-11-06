import { mountLazy } from '../../../skill/lib/runtime';

function retry(box: HTMLElement, again: () => void) {
  const note = document.createElement('p');
  note.className = 'flex h-full items-center justify-center gap-3 text-sm text-surface-muted';
  note.textContent = 'This scene did not load.';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'font-medium text-surface-ink underline underline-offset-4';
  button.textContent = 'Retry';
  button.addEventListener('click', again);
  note.append(button);
  box.replaceChildren(note);
}

export function mountArts() {
  mountLazy({ src: name => `${import.meta.env.BASE_URL}scenes/${name}.html`, onError: retry });
}
