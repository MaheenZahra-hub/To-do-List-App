/**
 * today-view.js
 * -----------------------------------------------------------------------
 * The Main Dashboard ("Today's Plan"). Renders the header/search/stats
 * chrome once, then re-renders only the task list whenever the search,
 * filter pills, category chips or sort order change — so the search
 * input never loses focus while typing.
 * -----------------------------------------------------------------------
 */

import { getTasks, toggleTaskCompleted, deleteTask, restoreTask, getStats } from '../storage.js';
import { escapeHtml, formatDate, formatTime, getWeekStrip, catIllustration } from '../components/utils.js';
import { filterTasks, sortTasks, collectCategories, wireSearchAndFilters } from '../components/search.js';
import { showUndoToast } from '../components/toast.js';

let sortBy = 'dueSoonest';
let filterState = { query: '', priorityPill: 'all', category: 'all' };

export function renderToday(root) {
  const tasks = getTasks();
  const stats = getStats();
  const categories = collectCategories(tasks);
  const week = getWeekStrip();

  root.innerHTML = `
    <div class="view view--today">
      <header class="app-header">
        <div class="header-top">
          <div class="avatar">${sproutIcon()}</div>
          <div style="flex:1;">
            <p class="greeting">Hi Maha! Ready for a green day?</p>
          </div>
          <button class="back-btn" id="summary-link-btn" aria-label="View day summary">${leafIcon()}</button>
        </div>
        <h1 class="app-title">My Sage Plan</h1>

        <div class="search-row">
          ${searchIcon()}
          <input type="text" class="search-input" placeholder="Search…" aria-label="Search tasks" />
        </div>

        <div class="pill-row" role="group" aria-label="Quick filters">
          <button class="pill is-active" data-priority-pill="all">All</button>
          <button class="pill" data-priority-pill="high">High Priority</button>
          <button class="pill" data-priority-pill="today">Today</button>
        </div>

        ${categories.length ? `
          <div class="category-row" role="group" aria-label="Categories">
            ${categories.map((c) => `<button class="tag-chip" data-category-chip="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('')}
          </div>` : ''}
      </header>

      <section class="stats-card" aria-label="Today's stats">
        <p class="stats-summary" id="stats-summary-text">
          Today's Focus: ${stats.total} Task${stats.total === 1 ? '' : 's'} (${stats.active} Active, ${stats.completed} Done)
        </p>
        <div class="stats-numbers">
          <div class="stat-circle">
            <span class="stat-value" id="stat-active">${stats.active}</span>
            <span class="stat-label">Active</span>
          </div>
          <div class="stat-circle">
            <span class="stat-value" id="stat-done">${stats.completed}</span>
            <span class="stat-label">Done</span>
          </div>
        </div>
        <div class="progress-track">
          <div class="progress-fill" id="stats-progress" style="width:${stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}%"></div>
        </div>
      </section>

      <div class="date-strip">
        ${week.map((d) => `
          <div class="date-chip ${d.isToday ? 'is-today' : ''}">
            <span class="date-label">${d.label}</span>
            <span class="date-num">${d.dayNum}</span>
          </div>`).join('')}
      </div>

      <div class="section-header">
        <span class="section-title">To Do</span>
        <span class="section-tag" id="section-tag">${filterState.category === 'all' ? 'All' : escapeHtml(filterState.category)}</span>
        <select class="sort-select" id="sort-select" aria-label="Sort tasks">
          <option value="dueSoonest">Due Soonest</option>
          <option value="priority">Priority</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      <ul class="task-list" id="task-list"></ul>

      <div id="footer-slot"></div>

      <div class="cta-dock">
        <button class="cta-button" id="add-task-btn">Add a New Task</button>
      </div>
    </div>
  `;

  // ---- Wire static controls ----
  root.querySelector('#sort-select').value = sortBy;
  root.querySelector('#sort-select').addEventListener('change', (e) => {
    sortBy = e.target.value;
    renderTaskList(root);
  });

  root.querySelector('#add-task-btn').addEventListener('click', () => {
    window.location.hash = '#/details';
  });

  root.querySelector('#summary-link-btn').addEventListener('click', () => {
    window.location.hash = '#/summary';
  });

  wireSearchAndFilters(root, (state) => {
    filterState = state;
    root.querySelector('#section-tag').textContent = state.category === 'all' ? 'All' : state.category;
    renderTaskList(root);
  });

  // ---- Event delegation for check / edit / delete on the list ----
  const listEl = root.querySelector('#task-list');
  listEl.addEventListener('click', (e) => {
    const checkBtn = e.target.closest('[data-action="toggle"]');
    const editBtn = e.target.closest('[data-action="edit"]');
    const deleteBtn = e.target.closest('[data-action="delete"]');

    if (checkBtn) {
      toggleTaskCompleted(checkBtn.dataset.id);
      refreshStats(root);
      renderTaskList(root);
    } else if (editBtn) {
      window.location.hash = `#/details/${editBtn.dataset.id}`;
    } else if (deleteBtn) {
      handleDelete(root, deleteBtn.dataset.id);
    }
  });

  renderTaskList(root);
}

/** Re-render just the <ul> of tasks (and footer delighter) using current filter/sort state. */
function renderTaskList(root) {
  const allTasks = getTasks();
  const filtered = sortTasks(filterTasks(allTasks, filterState), sortBy);
  const listEl = root.querySelector('#task-list');
  const footerSlot = root.querySelector('#footer-slot');

  if (allTasks.length === 0) {
    listEl.innerHTML = '';
    footerSlot.innerHTML = emptyDelighterMarkup();
    return;
  }

  if (filtered.length === 0) {
    listEl.innerHTML = `<li class="empty-inline">No tasks match your search or filters.</li>`;
    footerSlot.innerHTML = '';
    return;
  }

  footerSlot.innerHTML = '';
  listEl.innerHTML = filtered.map(taskItemMarkup).join('');
}

function refreshStats(root) {
  const stats = getStats();
  root.querySelector('#stats-summary-text').textContent =
    `Today's Focus: ${stats.total} Task${stats.total === 1 ? '' : 's'} (${stats.active} Active, ${stats.completed} Done)`;
  root.querySelector('#stat-active').textContent = stats.active;
  root.querySelector('#stat-done').textContent = stats.completed;
  root.querySelector('#stats-progress').style.width =
    `${stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}%`;
}

function handleDelete(root, id) {
  const result = deleteTask(id);
  if (!result) return;
  const { task, index } = result;
  refreshStats(root);
  renderTaskList(root);

  showUndoToast(`${task.title || 'Task'} deleted.`, () => {
    restoreTask(task, index);
    refreshStats(root);
    renderTaskList(root);
  });
}

function taskItemMarkup(task) {
  const metaDate = formatDate(task.dueDate);
  const metaTime = task.dueTime ? formatTime(task.dueTime) : '';
  return `
    <li class="task-item ${task.completed ? 'is-completed' : ''}" data-id="${task.id}">
      <button class="task-checkbox" data-action="toggle" data-id="${task.id}" aria-label="Toggle complete">
        ${checkIcon()}
      </button>
      <div class="task-body">
        <div class="task-meta">
          <span class="priority-dot priority-dot--${task.priority}"></span>
          <span>${[metaTime, metaDate].filter(Boolean).join(' | ')}</span>
        </div>
        <p class="task-title">${escapeHtml(task.title)}</p>
        ${task.tags.length ? `
          <div class="task-tags">
            ${task.tags.map((t) => `<span class="tag-chip">${escapeHtml(t)}</span>`).join('')}
          </div>` : ''}
        ${task.completed ? `<span class="done-chip">${checkIcon(true)} Done</span>` : ''}
      </div>
      <div class="task-actions">
        <button class="icon-btn" data-action="edit" data-id="${task.id}" aria-label="Edit task">${pencilIcon()}</button>
        <button class="icon-btn icon-btn--delete" data-action="delete" data-id="${task.id}" aria-label="Delete task">${trashIcon()}</button>
      </div>
    </li>
  `;
}

function emptyDelighterMarkup() {
  return `
    <div class="delighter">
      ${catIllustration()}
      <p class="delighter-text">All clear! A perfectly green day. Enjoy some relaxation or add a new task.</p>
    </div>
    <div class="quick-ideas">
      <span class="idea-pill">Meditate for 10 min</span>
      <span class="idea-pill">Read a chapter</span>
      <span class="idea-pill">Stretch</span>
    </div>
  `;
}

/* ---------------------------- inline icons ---------------------------- */

function sproutIcon() {
  return `<svg viewBox="0 0 24 24" fill="none"><path d="M12 21V12" stroke="#4C7A5A" stroke-width="1.8" stroke-linecap="round"/><path d="M12 12C12 12 6 12 6 6C12 6 12 12 12 12Z" fill="#88A38B"/><path d="M12 12C12 12 18 12 18 6C12 6 12 12 12 12Z" fill="#A9C4AC"/></svg>`;
}

function leafIcon() {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 13C3 13 3 3 13 3C13 13 3 13 3 13Z" stroke="white" stroke-width="1.4" stroke-linejoin="round"/><path d="M3 13L9 7" stroke="white" stroke-width="1.4" stroke-linecap="round"/></svg>`;
}

function searchIcon() {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="white" stroke-width="1.6"/><path d="M14 14L11 11" stroke="white" stroke-width="1.6" stroke-linecap="round"/></svg>`;
}

function checkIcon(small = false) {
  const size = small ? 9 : 12;
  return `<svg width="${size}" height="${size}" viewBox="0 0 14 14" fill="none"><path d="M2.5 7.2L5.4 10L11.5 3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function pencilIcon() {
  return `<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M11.3 2.3a1.4 1.4 0 0 1 2 2L5 12.6l-2.7.7.7-2.7 8.3-8.3Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>`;
}

function trashIcon() {
  return `<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 4.5h10M6.5 4.5V3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1.5M4.5 4.5l.6 8.2a1 1 0 0 0 1 .9h3.8a1 1 0 0 0 1-.9l.6-8.2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
