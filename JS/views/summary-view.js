/**
 * summary-view.js
 * -----------------------------------------------------------------------
 * "My Day Plan" — a calmer overview screen reachable at any time, and
 * also what naturally greets the user once every task is done. Hosts
 * the bulk "Clear All Completed Tasks" action behind the header menu.
 * -----------------------------------------------------------------------
 */

import { getStats, clearCompletedTasks } from '../storage.js';
import { catIllustration } from '../components/utils.js';

export function renderSummary(root) {
  const stats = getStats();

  root.innerHTML = `
    <div class="view view--summary">
      <header class="app-header app-header--compact" style="position:relative;">
        <button class="back-btn" id="back-btn" aria-label="Back to today">${backIcon()}</button>
        <span class="header-flex-title">My Day Plan</span>
        <button class="header-menu-btn" id="menu-btn" aria-label="More actions" aria-haspopup="true">${dotsIcon()}</button>

        <div class="menu-dropdown" id="menu-dropdown">
          <button type="button" id="clear-completed-btn">Clear All Completed Tasks</button>
        </div>
      </header>

      <section class="stats-card" style="margin-top:16px;">
        <p class="stats-summary">
          ${stats.total} Task${stats.total === 1 ? '' : 's'} total — ${stats.active} still active, ${stats.completed} done today.
        </p>
        <div class="progress-track">
          <div class="progress-fill" style="width:${stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}%"></div>
        </div>
      </section>

      <div class="delighter delighter--expanded">
        ${catIllustration()}
        <p class="delighter-text">All clear! A perfectly green day. Enjoy some relaxation or add a new task.</p>
      </div>

      <div class="quick-ideas">
        <span class="idea-pill">Meditate for 10 min</span>
        <span class="idea-pill">Read a chapter</span>
        <span class="idea-pill">Stretch</span>
      </div>

      <div class="cta-dock">
        <button class="cta-button" id="add-task-btn">Add a New Task</button>
      </div>
    </div>
  `;

  root.querySelector('#back-btn').addEventListener('click', () => {
    window.location.hash = '#/today';
  });
  root.querySelector('#add-task-btn').addEventListener('click', () => {
    window.location.hash = '#/details';
  });

  const menuBtn = root.querySelector('#menu-btn');
  const dropdown = root.querySelector('#menu-dropdown');
  
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('is-open');
  });

  // Clean, single target background click close
  document.addEventListener('click', (e) => {
    if (!menuBtn.contains(e.target)) {
      dropdown.classList.remove('is-open');
    }
  });
}

function backIcon() {
  return `<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M11 3L5 9L11 15" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}
function dotsIcon() {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="3" r="1.4" fill="white"/><circle cx="8" cy="8" r="1.4" fill="white"/><circle cx="8" cy="13" r="1.4" fill="white"/></svg>`;
}
