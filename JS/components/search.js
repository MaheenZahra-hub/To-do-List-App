/**
 * search.js
 * -----------------------------------------------------------------------
 * Pure filtering/sorting logic for the task list, plus a small helper to
 * wire a search input + filter pills to a re-render callback. Kept
 * side-effect free where possible so it's easy to unit test in isolation.
 * -----------------------------------------------------------------------
 */

import { debounce, todayISO } from './utils.js';

/**
 * @param {Array} tasks
 * @param {Object} state
 * @param {string} state.query - free-text search
 * @param {string} state.priorityPill - 'all' | 'high' | 'today'
 * @param {string} state.category - 'all' | tag name
 */
export function filterTasks(tasks, state = {}) {
  const { query = '', priorityPill = 'all', category = 'all' } = state;
  const q = query.trim().toLowerCase();
  const today = todayISO();

  return tasks.filter((task) => {
    if (q && !task.title.toLowerCase().includes(q) &&
        !(task.description || '').toLowerCase().includes(q)) {
      return false;
    }

    if (priorityPill === 'high' && task.priority !== 'high') return false;
    if (priorityPill === 'today' && task.dueDate !== today) return false;

    if (category !== 'all' && !task.tags.includes(category)) return false;

    return true;
  });
}

/** @param {Array} tasks  @param {'dueSoonest'|'priority'|'newest'} sortBy */
export function sortTasks(tasks, sortBy = 'dueSoonest') {
  const list = [...tasks];
  const priorityRank = { high: 0, medium: 1, low: 2 };

  switch (sortBy) {
    case 'priority':
      return list.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
    case 'newest':
      return list.sort((a, b) => b.createdAt - a.createdAt);
    case 'dueSoonest':
    default:
      return list.sort((a, b) => {
        const aKey = `${a.dueDate || '9999'} ${a.dueTime || '99:99'}`;
        const bKey = `${b.dueDate || '9999'} ${b.dueTime || '99:99'}`;
        return aKey.localeCompare(bKey);
      });
  }
}

/** Collect the unique set of tags present across all tasks (for category pills). */
export function collectCategories(tasks) {
  const set = new Set();
  tasks.forEach((t) => t.tags.forEach((tag) => set.add(tag)));
  return Array.from(set);
}

/**
 * Wire a search input + filter/category pill row to call `onChange`
 * whenever the user changes any of them. Returns the current filter
 * state object (mutated in place) so the caller can read it later.
 */
export function wireSearchAndFilters(root, onChange) {
  const state = { query: '', priorityPill: 'all', category: 'all' };

  const searchInput = root.querySelector('.search-input');
  const priorityPills = root.querySelectorAll('[data-priority-pill]');
  const categoryChips = root.querySelectorAll('[data-category-chip]');

  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      state.query = e.target.value;
      onChange(state);
    }, 180));
  }

  priorityPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      priorityPills.forEach((p) => p.classList.remove('is-active'));
      pill.classList.add('is-active');
      state.priorityPill = pill.dataset.priorityPill;
      onChange(state);
    });
  });

  categoryChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const isCurrentlySelected = chip.classList.contains('is-active');
      
      // Clear selection from all chips
      categoryChips.forEach((c) => c.classList.remove('is-active'));
      
      if (isCurrentlySelected) {
        state.category = 'all';
      } else {
        chip.classList.add('is-active');
        state.category = chip.dataset.categoryChip;
      }
      onChange(state);
    });
  });

  return state;
}
