/**
 * storage.js
 * -----------------------------------------------------------------------
 * The single source of truth for reading and writing tasks to
 * LocalStorage. Every view/component goes through these functions
 * instead of touching `localStorage` directly, so the storage shape
 * only has to be understood in one place.
 *
 * Task shape:
 * {
 *   id: string,
 *   title: string,
 *   description: string,
 *   dueDate: 'YYYY-MM-DD',
 *   dueTime: 'HH:MM' (24h),
 *   priority: 'high' | 'medium' | 'low',
 *   tags: string[],
 *   completed: boolean,
 *   createdAt: number (epoch ms)
 * }
 * -----------------------------------------------------------------------
 */

import { generateId, todayISO } from './components/utils.js';

const STORAGE_KEY = 'mySagePlan.tasks.v1';

/** Small starter set so the app isn't empty on first load. */
function seedTasks() {
  const today = todayISO();
  return [
    {
      id: generateId(),
      title: 'Finalize Q3 Report',
      description: 'Pull latest numbers from finance and proof the summary slide.',
      dueDate: today,
      dueTime: '11:30',
      priority: 'high',
      tags: ['Work', 'Presentation'],
      completed: false,
      createdAt: Date.now() - 5000,
    },
    {
      id: generateId(),
      title: 'Team standup notes',
      description: 'Write up blockers and share in #eng-standup.',
      dueDate: today,
      dueTime: '09:00',
      priority: 'medium',
      tags: ['Work', 'Review'],
      completed: true,
      createdAt: Date.now() - 4000,
    },
    {
      id: generateId(),
      title: 'Morning run',
      description: '',
      dueDate: today,
      dueTime: '07:00',
      priority: 'low',
      tags: ['Fitness'],
      completed: true,
      createdAt: Date.now() - 3000,
    },
    {
      id: generateId(),
      title: 'Buy groceries',
      description: 'Milk, oats, spinach, coffee.',
      dueDate: today,
      dueTime: '18:00',
      priority: 'medium',
      tags: ['Personal'],
      completed: false,
      createdAt: Date.now() - 2000,
    },
  ];
}

/** Read all tasks from LocalStorage (seeding on first run / bad data). */
export function getTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedTasks();
      saveTasks(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Self-healing migration: repair any task that's missing a valid id
    // (this could happen from an earlier version of the app) so it can
    // be toggled, edited and deleted like any other task.
    let needsSave = false;
    const repaired = parsed.map((t) => {
      if (!t || !t.id) {
        needsSave = true;
        return { ...t, id: generateId() };
      }
      return t;
    });
    if (needsSave) saveTasks(repaired);

    return repaired;
  } catch (err) {
    console.error('Sage Plan: failed to read tasks, starting fresh.', err);
    return [];
  }
}

/** Persist the full tasks array. */
export function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error('Sage Plan: failed to save tasks.', err);
  }
}

/** Look up a single task by id. */
export function getTaskById(id) {
  return getTasks().find((t) => t.id === id) || null;
}

/** Add a brand-new task, returns the created task. */
export function addTask(taskData) {
  const tasks = getTasks();
  const task = {
    title: '',
    description: '',
    dueDate: todayISO(),
    dueTime: '',
    priority: 'medium',
    tags: [],
    completed: false,
    createdAt: Date.now(),
    ...taskData,
    id: generateId(), // always assign a fresh id — never trust an incoming one here
  };
  tasks.unshift(task);
  saveTasks(tasks);
  return task;
}

/** Patch an existing task by id. */
export function updateTask(id, updates) {
  const tasks = getTasks();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  tasks[idx] = { ...tasks[idx], ...updates };
  saveTasks(tasks);
  return tasks[idx];
}

/** Toggle a task's completed flag. */
export function toggleTaskCompleted(id) {
  const task = getTaskById(id);
  if (!task) return null;
  return updateTask(id, { completed: !task.completed });
}

/**
 * Delete a task by id. Returns { task, index } so the caller (the toast
 * component) can restore it in its exact previous position on Undo.
 */
export function deleteTask(id) {
  const tasks = getTasks();
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return null;
  const [task] = tasks.splice(index, 1);
  saveTasks(tasks);
  return { task, index };
}

/** Re-insert a previously deleted task at its original index (Undo). */
export function restoreTask(task, index) {
  const tasks = getTasks();
  const safeIndex = Math.max(0, Math.min(index, tasks.length));
  tasks.splice(safeIndex, 0, task);
  saveTasks(tasks);
}

/** Permanently remove every completed task (bulk action). */
export function clearCompletedTasks() {
  const tasks = getTasks().filter((t) => !t.completed);
  saveTasks(tasks);
  return tasks;
}

/** Quick stats used by the dashboard header. */
export function getStats() {
  const tasks = getTasks();
  const completed = tasks.filter((t) => t.completed).length;
  return {
    total: tasks.length,
    active: tasks.length - completed,
    completed,
  };
}