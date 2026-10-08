const fs = require('fs');
const path = require('path');
const os = require('os');

const DATA_DIR = process.env.REMINDR_DATA_DIR ? path.resolve(process.env.REMINDR_DATA_DIR) : path.join(os.homedir(), '.remindr');
const DATA_FILE = path.join(DATA_DIR, 'reminders.json');
const VALID_PRIORITIES = new Set(['none', 'low', 'medium', 'high']);

function emptyData() {
  return { reminders: [], lists: ['Default'], nextId: 1 };
}

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  try { fs.chmodSync(DATA_DIR, 0o700); } catch (_) {}
}

function normalizeData(data) {
  if (!data || typeof data !== 'object') return emptyData();

  const reminders = Array.isArray(data.reminders) ? data.reminders : [];
  const lists = Array.isArray(data.lists)
    ? data.lists.filter(v => typeof v === 'string' && v.trim())
    : [];

  const maxId = reminders.reduce((max, reminder) => {
    return Number.isSafeInteger(reminder && reminder.id) && reminder.id > max ? reminder.id : max;
  }, 0);
  let nextId = Number.isSafeInteger(data.nextId) && data.nextId > 0 ? data.nextId : 1;
  if (nextId <= maxId) nextId = maxId + 1;
  if (!Number.isSafeInteger(nextId)) throw new Error('Reminder id limit reached.');
  if (!lists.some(name => name.toLowerCase() === 'default')) lists.unshift('Default');

  return { reminders, lists, nextId };
}

function load() {
  ensureDir();
  if (!fs.existsSync(DATA_FILE)) return emptyData();

  try {
    return normalizeData(JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')));
  } catch (err) {
    throw new Error(`Cannot read ${DATA_FILE}: ${err.message}`);
  }
}

function save(data) {
  ensureDir();
  const temp = path.join(
    DATA_DIR,
    `.reminders-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}.tmp`
  );

  try {
    const fd = fs.openSync(temp, 'w', 0o600);
    try {
      fs.writeFileSync(fd, JSON.stringify(normalizeData(data), null, 2), 'utf8');
    } finally {
      fs.closeSync(fd);
    }
    try {
      fs.renameSync(temp, DATA_FILE);
    } catch (err) {
      // Windows cannot replace an existing file with rename(). Fall back to a complete copy.
      if (err.code !== 'EEXIST' && err.code !== 'EPERM' && err.code !== 'ENOTEMPTY') throw err;
      fs.copyFileSync(temp, DATA_FILE);
      fs.unlinkSync(temp);
    }
    try { fs.chmodSync(DATA_FILE, 0o600); } catch (_) {}
  } catch (err) {
    try { fs.unlinkSync(temp); } catch (_) {}
    throw new Error(`Cannot save reminders: ${err.message}`);
  }
}

function cleanName(name, label = 'List name') {
  if (typeof name !== 'string' || !name.trim()) throw new Error(`${label} cannot be empty.`);
  return name.trim();
}

function cleanTitle(title) {
  if (typeof title !== 'string' || !title.trim()) throw new Error('Reminder title cannot be empty.');
  return title.trim();
}

function validatePriority(priority) {
  if (!VALID_PRIORITIES.has(priority)) {
    throw new Error('Priority must be one of: none, low, medium, high.');
  }
  return priority;
}

function addReminder(title, opts = {}) {
  const data = load();
  const clean = cleanTitle(title);
  const list = opts.list ? cleanName(opts.list) : 'Default';
  const priority = validatePriority(opts.priority || 'none');

  if (!data.lists.some(name => name.toLowerCase() === list.toLowerCase())) data.lists.push(list);

  const reminder = {
    id: data.nextId++,
    title: clean,
    list,
    due: opts.due || null,
    notes: typeof opts.notes === 'string' && opts.notes.trim() ? opts.notes.trim() : null,
    priority,
    completed: false,
    createdAt: new Date().toISOString()
  };

  data.reminders.push(reminder);
  save(data);
  return reminder;
}

function getReminders(filter = {}) {
  const data = load();
  let results = data.reminders.slice();

  if (filter.list) {
    const target = String(filter.list).toLowerCase();
    results = results.filter(r => typeof r.list === 'string' && r.list.toLowerCase() === target);
  }

  if (filter.completed === true) results = results.filter(r => r.completed === true);
  else if (filter.completed === false) results = results.filter(r => r.completed !== true);

  const today = localDateStr(new Date());

  if (filter.due === 'today') {
    results = results.filter(r => r.due && String(r.due).slice(0, 10) === today);
  } else if (filter.due === 'tomorrow') {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    results = results.filter(r => r.due && String(r.due).slice(0, 10) === localDateStr(d));
  } else if (filter.due === 'week') {
    const end = new Date();
    end.setDate(end.getDate() + 7);
    const endStr = localDateStr(end);
    results = results.filter(r => {
      if (!r.due) return false;
      const due = String(r.due).slice(0, 10);
      return due >= today && due <= endStr;
    });
  } else if (filter.due === 'overdue') {
    results = results.filter(r => r.due && String(r.due).slice(0, 10) < today && r.completed !== true);
  }

  return results;
}

function completeReminder(id) {
  const data = load();
  const reminder = data.reminders.find(r => r.id === id);
  if (!reminder) return null;
  if (!reminder.completed) {
    reminder.completed = true;
    reminder.completedAt = new Date().toISOString();
    save(data);
  }
  return reminder;
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
  const reminder = data.reminders.find(r => r.id === id);
  if (!reminder) return null;

  if (updates.title !== undefined) reminder.title = cleanTitle(updates.title);

  if (updates.list !== undefined) {
    const newList = cleanName(updates.list);
    reminder.list = newList;
    if (!data.lists.some(name => name.toLowerCase() === newList.toLowerCase())) data.lists.push(newList);
  }

  if (updates.due !== undefined) reminder.due = updates.due || null;
  if (updates.notes !== undefined) reminder.notes = updates.notes ? String(updates.notes).trim() || null : null;
  if (updates.priority !== undefined) reminder.priority = validatePriority(updates.priority);

  save(data);
  return reminder;
}

function getLists() {
  return load().lists.slice();
}

function createList(name) {
  const data = load();
  const clean = cleanName(name);
  if (data.lists.some(existing => existing.toLowerCase() === clean.toLowerCase())) return false;
  data.lists.push(clean);
  save(data);
  return true;
}

function renameList(oldName, newName) {
  const data = load();
  const oldClean = cleanName(oldName);
  const newClean = cleanName(newName);

  const idx = data.lists.findIndex(name => name.toLowerCase() === oldClean.toLowerCase());
  if (idx === -1) return false;
  if (oldClean.toLowerCase() === newClean.toLowerCase()) return false;
  if (data.lists.some(name => name.toLowerCase() === newClean.toLowerCase())) return false;

  data.lists[idx] = newClean;
  data.reminders.forEach(r => {
    if (typeof r.list === 'string' && r.list.toLowerCase() === oldClean.toLowerCase()) r.list = newClean;
  });

  save(data);
  return true;
}

function deleteList(name) {
  const data = load();
  const clean = cleanName(name);
  if (clean.toLowerCase() === 'default') throw new Error('The Default list cannot be deleted.');

  const idx = data.lists.findIndex(existing => existing.toLowerCase() === clean.toLowerCase());
  if (idx === -1) return false;

  data.lists.splice(idx, 1);
  data.reminders = data.reminders.filter(r => !(typeof r.list === 'string' && r.list.toLowerCase() === clean.toLowerCase()));
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
  deleteList
};