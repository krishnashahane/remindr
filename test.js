const assert = require('assert');
const store = require('./src/store');
const { parseDate } = require('./src/date');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Use a temp dir for tests
const origDir = path.join(os.homedir(), '.remindr');
const backupFile = path.join(origDir, 'reminders.json');
let backup = null;

// Backup existing data
if (fs.existsSync(backupFile)) {
  backup = fs.readFileSync(backupFile, 'utf8');
}

function cleanup() {
  // Restore or remove
  if (backup) {
    fs.writeFileSync(backupFile, backup, 'utf8');
  } else if (fs.existsSync(backupFile)) {
    fs.unlinkSync(backupFile);
  }
}

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    // Clear data before each test
    if (fs.existsSync(backupFile)) fs.unlinkSync(backupFile);
    fn();
    passed++;
    console.log(`  pass: ${name}`);
  } catch (err) {
    failed++;
    console.log(`  FAIL: ${name}`);
    console.log(`        ${err.message}`);
  }
}

console.log('Running tests...\n');

// Date parsing
test('parseDate: today', () => {
  const result = parseDate('today');
  const now = new Date();
  const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  assert.strictEqual(result, expected);
});

test('parseDate: tomorrow', () => {
  const result = parseDate('tomorrow');
  assert.ok(result);
});

test('parseDate: ISO date', () => {
  assert.strictEqual(parseDate('2026-01-15'), '2026-01-15');
});

test('parseDate: invalid', () => {
  assert.strictEqual(parseDate('notadate'), null);
});

// Store operations
test('addReminder: basic', () => {
  const r = store.addReminder('Test task');
  assert.strictEqual(r.title, 'Test task');
  assert.strictEqual(r.id, 1);
  assert.strictEqual(r.completed, false);
  assert.strictEqual(r.list, 'Default');
});

test('addReminder: with options', () => {
  const r = store.addReminder('Work task', { list: 'Work', due: '2026-03-15', priority: 'high' });
  assert.strictEqual(r.list, 'Work');
  assert.strictEqual(r.due, '2026-03-15');
  assert.strictEqual(r.priority, 'high');
});

test('getReminders: all', () => {
  store.addReminder('Task 1');
  store.addReminder('Task 2');
  const all = store.getReminders({});
  assert.strictEqual(all.length, 2);
});

test('getReminders: by list', () => {
  store.addReminder('Task 1', { list: 'Work' });
  store.addReminder('Task 2', { list: 'Personal' });
  const work = store.getReminders({ list: 'Work' });
  assert.strictEqual(work.length, 1);
  assert.strictEqual(work[0].list, 'Work');
});

test('completeReminder', () => {
  const r = store.addReminder('Complete me');
  const done = store.completeReminder(r.id);
  assert.strictEqual(done.completed, true);
});

test('deleteReminder', () => {
  const r = store.addReminder('Delete me');
  store.deleteReminder(r.id);
  const all = store.getReminders({});
  assert.strictEqual(all.length, 0);
});

test('editReminder', () => {
  const r = store.addReminder('Old title');
  const updated = store.editReminder(r.id, { title: 'New title' });
  assert.strictEqual(updated.title, 'New title');
});

// Lists
test('getLists: default', () => {
  store.addReminder('x');
  const lists = store.getLists();
  assert.ok(lists.includes('Default'));
});

test('createList', () => {
  store.addReminder('x');
  assert.ok(store.createList('Projects'));
  const lists = store.getLists();
  assert.ok(lists.includes('Projects'));
});

test('renameList', () => {
  store.addReminder('task', { list: 'Old' });
  store.renameList('Old', 'New');
  const lists = store.getLists();
  assert.ok(lists.includes('New'));
  assert.ok(!lists.includes('Old'));
});

test('deleteList', () => {
  store.addReminder('task', { list: 'Temp' });
  store.deleteList('Temp');
  const lists = store.getLists();
  assert.ok(!lists.includes('Temp'));
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);
cleanup();
process.exit(failed > 0 ? 1 : 0);
