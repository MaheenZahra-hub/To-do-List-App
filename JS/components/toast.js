/**
 * toast.js
 * -----------------------------------------------------------------------
 * A single, reusable "Undo" toast. It lazily creates its own DOM node
 * inside the app shell the first time it's used, then just shows/hides
 * that same node — so any view can call showUndoToast() without caring
 * where in the DOM the toast physically lives.
 * -----------------------------------------------------------------------
 */

const AUTO_HIDE_MS = 3000;
let hideTimer = null;

function getToastEl() {
  let el = document.getElementById('undo-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'undo-toast';
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.innerHTML = `
      <span class="toast-message"></span>
      <button type="button" class="toast-undo-btn">Undo</button>
    `;
    const shell = document.querySelector('.app-shell') || document.body;
    shell.appendChild(el);
  }
  return el;
}

/**
 * Show a toast with a message and an Undo action.
 * @param {string} message - e.g. "Grocery List deleted."
 * @param {Function} onUndo - called if the user clicks Undo within 3s.
 */
export function showUndoToast(message, onUndo) {
  const el = getToastEl();
  const msgEl = el.querySelector('.toast-message');
  const undoBtn = el.querySelector('.toast-undo-btn');

  msgEl.textContent = message;
  el.classList.add('is-visible');

  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => hideToast(), AUTO_HIDE_MS);

  // Replace the button to drop any previously-attached listener.
  const freshBtn = undoBtn.cloneNode(true);
  undoBtn.replaceWith(freshBtn);
  freshBtn.addEventListener('click', () => {
    clearTimeout(hideTimer);
    hideToast();
    if (typeof onUndo === 'function') onUndo();
  });
}

export function hideToast() {
  const el = document.getElementById('undo-toast');
  if (el) el.classList.remove('is-visible');
}
