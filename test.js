const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'remindr-test-'));
process.env.REMINDR_DATA_DIR = tempDir;

const store = require('./src/store');
const { parseDate } = require('./src/date');
const { formatList } = require('./src/format');
const { parseArgs } = require('./src/cli');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  pass: ${name}`);
  } catch (err) {
    failed++;
    console.error(`  FAIL: ${name}`);
    console.error(`        ${err.message}`);
  }
}

function reset() {
  const file = path.join(tempDir, 'reminders.json');
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

process.on('exit', () => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

console.log('Running tests...\n');

// Date parsing
test('parseDate: today', () => {
  const now = new Date();
  assert.strictEqual(parseDate('today'), formatLocal(now));
});

test('parseDate: tomorrow', () => {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  assert.strictEqual(parseDate('tomorrow'), formatLocal(now));
});

test('parseDate: yesterday', () => {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  assert.strictEqual(parseDate('yesterday'), formatLocal(now));
});

test('parseDate: valid date', () => {
  assert.strictEqual(parseDate('2026-01-15'), '2026-01-15');
});

test('parseDate: invalid calendar date', () => {
  assert.strictEqual(parseDate('2026-02-30'), null);
});

test('parseDate: valid local date-time', () => {
  assert.strictEqual(parseDate('2026-01-15 14:30'), '2026-01-15 14:30');
});

test('parseDate: invalid local time', () => {
  assert.strictEqual(parseDate('2026-01-15 25:30'), null);
});

// Store operations
test('addReminder: basic', () => {
  reset();
  const r = store.addReminder('Test task');
  assert.deepStrictEqual(
    { title: r.title, id: r.id, completed: r.completed, list: r.list },
    { title: 'Test task', id: 1, completed: false, list: 'Default' }
  );
});

test('addReminder: validates priority', () => {
  assert.throws(() => store.addReminder('Bad', { priority: 'urgent' }), /Priority must be one of/);
});

test('addReminder: trims title and notes', () => {
  const r = store.addReminder('  Task  ', { notes: '  details  ' });
  assert.strictEqual(r.title, 'Task');
  assert.strictEqual(r.notes, 'details');
});

test('getReminders: filters by list case-insensitively', () => {
  store.addReminder('Task 1', { list: 'Work' });
  store.addReminder('Task 2', { list: 'Personal' });
  assert.strictEqual(store.getReminders({ list: 'work' }).length, 1);
});

test('completeReminder: idempotent', () => {
  const r = store.addReminder('Complete me');
  const first = store.completeReminder(r.id);
  const second = store.completeReminder(r.id);
  assert.strictEqual(first.completed, true);
  assert.strictEqual(second.completed, true);
  assert.strictEqual(second.id, r.id);
});

test('deleteReminder', () => {
  const r = store.addReminder('Delete me');
  assert.strictEqual(store.deleteReminder(r.id).title, 'Delete me');
  assert.strictEqual(store.getReminders({}).some(item => item.id === r.id), false);
});

test('editReminder: clears due date and notes', () => {
  const r = store.addReminder('Old title', { due: '2026-03-15', notes: 'note' });
  const updated = store.editReminder(r.id, { title: 'New title', due: null, notes: '' });
  assert.strictEqual(updated.title, 'New title');
  assert.strictEqual(updated.due, null);
  assert.strictEqual(updated.notes, null);
});

test('createList: duplicate names are rejected case-insensitively', () => {
  assert.strictEqual(store.createList('Projects'), true);
  assert.strictEqual(store.createList('projects'), false);
});

test('renameList: updates reminders and prevents collisions', () => {
  const r = store.addReminder('Project task', { list: 'Projects' });
  assert.strictEqual(store.renameList('projects', 'Work'), true);
  assert.strictEqual(store.getReminders({ list: 'work' })[0].id, r.id);
  assert.strictEqual(store.renameList('Work', 'Default'), false);
});

test('deleteList: Default cannot be deleted', () => {
  assert.throws(() => store.deleteList('Default'), /cannot be deleted/i);
});

test('deleteList: custom list deletes its reminders', () => {
  const r = store.addReminder('Temporary', { list: 'Temporary' });
  assert.strictEqual(store.deleteList('temporary'), true);
  assert.strictEqual(store.getReminders({}).some(item => item.id === r.id), false);
});

test('storage: next id remains unique after deleted highest id', () => {
  const a = store.addReminder('A');
  const b = store.addReminder('B');
  store.deleteReminder(b.id);
  const c = store.addReminder('C');
  assert.strictEqual(c.id, b.id + 1);
  assert.strictEqual(c.id > a.id, true);
});

test('format: plain output sanitizes line breaks and tabs', () => {
  const output = formatList([{
    id: 1,
    title: 'hello\nworld\tvalue',
    list: 'Work',
    due: null,
    priority: 'none',
    completed: false
  }], { plain: true });
  assert.strictEqual(output.includes('\nworld'), false);
  assert.strictEqual(output.includes('\tvalue'), false);
});

test('parseArgs: unknown options are rejected', () => {
  assert.throws(() => parseArgs(['add', 'Task', '--wat']), /Unknown option/);
});

test('parseArgs: missing option values are rejected', () => {
  assert.throws(() => parseArgs(['add', '--title']), /requires a value/);
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exitCode = failed ? 1 : 0;

function formatLocal(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
}
