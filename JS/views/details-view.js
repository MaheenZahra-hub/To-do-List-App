/**
 * details-view.js
 * -----------------------------------------------------------------------
 * The Add/Edit Task form. Same view handles both flows: with no `id` it
 * starts blank (Add), with an `id` it's pre-populated from storage (Edit).
 * -----------------------------------------------------------------------
 */

import { getTaskById, addTask, updateTask } from '../storage.js';
import { escapeHtml, todayISO, PRIORITY_META } from '../components/utils.js';

/** In-memory draft for the form currently being edited. */
let draft = null;

export function renderDetails(root, params = {}) {
  const editingId = params.id || null;
  const existing = editingId ? getTaskById(editingId) : null;

  draft = existing
    ? { ...existing, tags: [...existing.tags] }
    : {
        id: null,
        title: '',
        description: '',
        dueDate: todayISO(),
        dueTime: '',
        priority: 'medium',
        tags: [],
        completed: false,
      };

  root.innerHTML = `
    <div class="view view--details">
      <header class="app-header app-header--compact">
        <button class="back-btn" id="back-btn" aria-label="Go back">${backIcon()}</button>
        <span class="header-flex-title">Task Details</span>
        <button class="header-save-btn" id="save-btn">Save</button>
      </header>

      <div class="form-body">
        <div class="form-group">
          <label class="form-label" for="input-title">Task Title</label>
          <input id="input-title" class="form-input" type="text" maxlength="120"
                 placeholder="e.g. Finalize Q3 Report" value="${escapeHtml(draft.title)}" />
        </div>

        <div class="form-group">
          <label class="form-label" for="input-date">Due Date</label>
          <div class="input-with-icon">
            <input id="input-date" class="form-input" type="date" value="${escapeHtml(draft.dueDate || '')}" />
            ${calendarIcon()}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="input-time">Due Time</label>
          <div class="input-with-icon">
            <input id="input-time" class="form-input" type="time" value="${escapeHtml(draft.dueTime || '')}" />
            ${clockIcon()}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="input-desc">Description</label>
          <textarea id="input-desc" class="form-textarea" maxlength="500"
                    placeholder="Add any extra detail…">${escapeHtml(draft.description)}</textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Priority</label>
          <div class="priority-selector" id="priority-selector">
            ${Object.entries(PRIORITY_META).map(([key, meta]) => `
              <button type="button" class="priority-pill ${draft.priority === key ? 'is-selected' : ''}" data-priority="${key}">
                <span class="priority-dot priority-dot--${key}"></span>${meta.label}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Categories / Tags</label>
          <div class="tag-manager" id="tag-manager">
            ${renderTagChips()}
            <input type="text" class="tag-input" id="tag-input" placeholder="+ Add tag" maxlength="24" />
          </div>
        </div>

        <button class="clear-fields-link" id="clear-fields-btn" type="button">Clear All Fields</button>
      </div>
    </div>
  `;

  wireEvents(root, editingId);
}

function renderTagChips() {
  return draft.tags.map((tag, i) => `
    <span class="tag-chip" data-tag-index="${i}">
      ${escapeHtml(tag)}
      <button type="button" class="tag-remove-btn" data-remove-tag="${i}" aria-label="Remove ${escapeHtml(tag)} tag">${xIcon()}</button>
    </span>
  `).join('');
}

function wireEvents(root, editingId) {
  root.querySelector('#back-btn').addEventListener('click', () => {
    window.location.hash = '#/today';
  });

  root.querySelector('#input-title').addEventListener('input', (e) => { draft.title = e.target.value; });
  root.querySelector('#input-date').addEventListener('input', (e) => { draft.dueDate = e.target.value; });
  root.querySelector('#input-time').addEventListener('input', (e) => { draft.dueTime = e.target.value; });
  root.querySelector('#input-desc').addEventListener('input', (e) => { draft.description = e.target.value; });

  root.querySelector('#priority-selector').addEventListener('click', (e) => {
    const btn = e.target.closest('.priority-pill');
    if (!btn) return;
    draft.priority = btn.dataset.priority;
    root.querySelectorAll('.priority-pill').forEach((p) => p.classList.remove('is-selected'));
    btn.classList.add('is-selected');
  });

  const tagManager = root.querySelector('#tag-manager');
  const tagInput = root.querySelector('#tag-input');

  tagManager.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('[data-remove-tag]');
    if (!removeBtn) return;
    const idx = Number(removeBtn.dataset.removeTag);
    draft.tags.splice(idx, 1);
    refreshTagChips(root);
  });

  tagInput.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const value = tagInput.value.trim();
    if (value && !draft.tags.includes(value)) {
      draft.tags.push(value);
      tagInput.value = '';
      refreshTagChips(root);
    }
  });

  root.querySelector('#clear-fields-btn').addEventListener('click', () => {
    draft = {
      id: draft.id,
      title: '', description: '', dueDate: todayISO(), dueTime: '',
      priority: 'medium', tags: [], completed: draft.completed,
    };
    renderDetails(root, { id: editingId });
  });

  root.querySelector('#save-btn').addEventListener('click', () => {
    if (!draft.title.trim()) {
      root.querySelector('#input-title').focus();
      return;
    }

    // CHECK FOR UNCOMMITTED INPUT TEXT BEFORE SAVING
    const tagInputEl = root.querySelector('#tag-input');
    if (tagInputEl && tagInputEl.value.trim()) {
      const remainingTag = tagInputEl.value.trim();
      if (!draft.tags.includes(remainingTag)) {
        draft.tags.push(remainingTag);
      }
    }

    if (editingId) {
      updateTask(editingId, { ...draft });
    } else {
      addTask({ ...draft });
    }
    window.location.hash = '#/today';
  });
}

function refreshTagChips(root) {
  const wrapper = root.querySelector('#tag-manager');
  wrapper.innerHTML = renderTagChips() + `<input type="text" class="tag-input" id="tag-input" placeholder="+ Add tag" maxlength="24" />`;
  
  const freshInput = wrapper.querySelector('#tag-input');
  freshInput.focus();
  
  // Clean binding assignment
  freshInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = freshInput.value.trim();
      if (value && !draft.tags.includes(value)) {
        draft.tags.push(value);
        freshInput.value = '';
        refreshTagChips(root);
      }
    }
  });
}

/* ---------------------------- inline icons ---------------------------- */

function backIcon() {
  return `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 3L5 9L11 15" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function calendarIcon() {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" stroke-width="1.3"/><path d="M2 6.5H14" stroke="currentColor" stroke-width="1.3"/><path d="M5 1.5V4M11 1.5V4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`;
}
function clockIcon() {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.2" stroke="currentColor" stroke-width="1.3"/><path d="M8 4.5V8L10.5 9.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`;
}
function xIcon() {
  return `<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
}
