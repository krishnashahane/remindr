const fs = require('fs');
const path = require('path');
const os = require('os');

const DATA_DIR = path.join(os.homedir(), '.remindr');
const DATA_FILE = path.join(DATA_DIR, 'reminders.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function load() {
  ensureDir();
  if (!fs.existsSync(DATA_FILE)) {
    return { reminders: [], lists: ['Default'], nextId: 1 };
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function save(data) {
  ensureDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function addReminder(title, opts = {}) {
  const data = load();
  const list = opts.list || 'Default';
  if (!data.lists.includes(list)) {
    data.lists.push(list);
  }
  const reminder = {
    id: data.nextId++,
    title,
    list,
    due: opts.due || null,
    notes: opts.notes || null,
    priority: opts.priority || 'none',
    completed: false,
    createdAt: new Date().toISOString(),
  };
  data.reminders.push(reminder);
  save(data);
  return reminder;
}

function getReminders(filter = {}) {
  const data = load();
  let results = data.reminders;

  if (filter.list) {
    results = results.filter(r => r.list.toLowerCase() === filter.list.toLowerCase());
  }
  if (filter.completed === true) {
    results = results.filter(r => r.completed);
  } else if (filter.completed === false) {
    results = results.filter(r => !r.completed);
  }
  if (filter.due === 'today') {
    const today = localDateStr(new Date());
    results = results.filter(r => r.due && r.due.slice(0, 10) === today);
  } else if (filter.due === 'tomorrow') {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const tom = localDateStr(d);
    results = results.filter(r => r.due && r.due.slice(0, 10) === tom);
  } else if (filter.due === 'week') {
    const today = localDateStr(new Date());
    const end = new Date();
    end.setDate(end.getDate() + 7);
    const endStr = localDateStr(end);
    results = results.filter(r => {
      if (!r.due) return false;
      const ds = r.due.slice(0, 10);
      return ds >= today && ds <= endStr;
    });
  } else if (filter.due === 'overdue') {
    const today = localDateStr(new Date());
    results = results.filter(r => r.due && r.due.slice(0, 10) < today && !r.completed);
  }

  return results;
}

function completeReminder(id) {
  const data = load();
  const r = data.reminders.find(r => r.id === id);
  if (!r) return null;
  r.completed = true;
  r.completedAt = new Date().toISOString();
  save(data);
  return r;
}

function deleteReminder(id) {
  const data = load();
  const idx = data.reminders.findIndex(r => r.id === id);
  if (idx === -1) return null;
  const removed = data.reminders.splice(idx, 1)[0];
  save(data);
  return removed;
}

function editReminder(id, updates) {
  const data = load();
  const r = data.reminders.find(r => r.id === id);
  if (!r) return null;
  if (updates.title !== undefined) r.title = updates.title;
  if (updates.list !== undefined) {
    r.list = updates.list;
    if (!data.lists.includes(updates.list)) data.lists.push(updates.list);
  }
  if (updates.due !== undefined) r.due = updates.due;
  if (updates.notes !== undefined) r.notes = updates.notes;
  if (updates.priority !== undefined) r.priority = updates.priority;
  save(data);
  return r;
}

function getLists() {
  return load().lists;
}

function createList(name) {
  const data = load();
  if (data.lists.includes(name)) return false;
  data.lists.push(name);
  save(data);
  return true;
}

function renameList(oldName, newName) {
  const data = load();
  const idx = data.lists.indexOf(oldName);
  if (idx === -1) return false;
  data.lists[idx] = newName;
  data.reminders.forEach(r => {
    if (r.list === oldName) r.list = newName;
  });
  save(data);
  return true;
}

function deleteList(name) {
  const data = load();
  const idx = data.lists.indexOf(name);
  if (idx === -1) return false;
  data.lists.splice(idx, 1);
  data.reminders = data.reminders.filter(r => r.list !== name);
  save(data);
  return true;
}

function localDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

module.exports = {
  addReminder,
  getReminders,
  completeReminder,
  deleteReminder,
  editReminder,
  getLists,
  createList,
  renameList,
  deleteList,
};
