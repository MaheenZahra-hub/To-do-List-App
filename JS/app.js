/**
 * app.js
 * -----------------------------------------------------------------------
 * The SPA's entry point. A tiny hash router maps URLs to view renderers:
 *
 *   #/today             -> Main Dashboard
 *   #/details            -> Add Task (blank form)
 *   #/details/:id        -> Edit Task (pre-filled form)
 *   #/summary             -> My Day Plan / empty-state summary
 *
 * Each view module exports a render(root, params) function that owns
 * building its own markup and wiring its own events; app.js only decides
 * which one gets mounted into #app.
 * -----------------------------------------------------------------------
 */

import { renderToday } from './views/today-view.js';
import { renderDetails } from './views/details-view.js';
import { renderSummary } from './views/summary-view.js';

const root = document.getElementById('app');

function parseHash() {
  // "#/details/abc123" -> ['details', 'abc123']
  const clean = window.location.hash.replace(/^#\/?/, '');
  const [route, param] = clean.split('/').filter(Boolean);
  return { route: route || 'today', param };
}

function router() {
  const { route, param } = parseHash();

  switch (route) {
    case 'details':
      renderDetails(root, { id: param });
      break;
    case 'summary':
      renderSummary(root);
      break;
    case 'today':
    default:
      renderToday(root);
      break;
  }

  // Keep each new view scrolled to the top.
  const shell = document.querySelector('.app-shell');
  if (shell) shell.scrollTop = 0;
}

function init() {
    window.addEventListener('hashchange', router);
    if (!window.location.hash || window.location.hash === '#/') {
      window.location.hash = '#/today';
    } else {
      router(); // Core runtime trigger launch execution parameters
    }
}

document.addEventListener('DOMContentLoaded', init);
