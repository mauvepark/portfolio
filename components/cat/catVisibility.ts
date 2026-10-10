// Whether the visitor has shooed the cat away. Kept in localStorage (per browser)
// and broadcast with a window event so the footer's [call the cat] link stays in sync.

const KEY = 'cat:hidden';
export const CAT_EVENT = 'cat:visibility';

export function readCatHidden(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function setCatHidden(hidden: boolean) {
  try {
    if (hidden) localStorage.setItem(KEY, '1');
    else localStorage.removeItem(KEY);
  } catch {
    // Storage blocked (private mode etc.) — still hide/show for this page view.
  }
  window.dispatchEvent(new CustomEvent(CAT_EVENT, { detail: { hidden } }));
}
