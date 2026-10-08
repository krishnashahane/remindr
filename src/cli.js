const pkg = require('../package.json');
const store = require('./store');
const { formatList } = require('./format');
const { parseDate } = require('./date');

const BOOLEAN_FLAGS = new Set(['--json', '--plain', '--quiet', '--delete']);
const VALUE_FLAGS = new Set(['--title', '--list', '--due', '--notes', '--priority', '--create', '--rename']);

function run(args) {
  try {
    const { command, positional, flags } = parseArgs(args);
    const opts = {
      json: flags['--json'] === true,
      plain: flags['--plain'] === true,
      quiet: flags['--quiet'] === true
    };

    switch (command) {
      case 'add': return cmdAdd(positional, flags);
      case 'show':
      case 'today': return cmdShow('today', opts);
      case 'tomorrow': return cmdShow('tomorrow', opts);
      case 'week':
      case 'upcoming': return cmdShow('week', opts);
      case 'overdue': return cmdShow('overdue', opts);
      case 'completed':
      case 'done': return cmdCompleted(opts);
      case 'all': return cmdAll(opts);
      case 'complete': return cmdComplete(positional);
      case 'delete':
      case 'rm': return cmdDelete(positional);
      case 'edit': return cmdEdit(positional, flags);
      case 'list':
      case 'lists': return cmdList(positional, flags, opts);
      case 'help':
      case '--help':
      case '-h': return cmdHelp();
      case 'version':
      case '--version':
      case '-v': return cmdVersion();
      default:
        if (!command) return cmdShow('today', opts);
        return cmdDate(command, opts);
    }
  } catch (err) {
    return fail(err.message);
  }
}

function cmdDate(input, opts) {
  const due = parseDate(input);
  if (!due) return fail(`Unknown command: ${input}\nRun "remindr help" for usage.`);
  const target = due.slice(0, 10);
  const reminders = store.getReminders({ completed: false }).filter(r => r.due && String(r.due).slice(0, 10) === target);
  console.log(formatList(reminders, opts));
}

function cmdAdd(positional, flags) {
  const title = flags['--title'] ?? positional[0];
  if (!title) return fail('Usage: remindr add "title" [--list NAME] [--due DATE] [--notes TEXT] [--priority low|medium|high|none]');

  const due = flags['--due'] !== undefined ? parseDate(flags['--due']) : null;
  if (flags['--due'] !== undefined && !due) return fail(`Invalid date: ${flags['--due']}`);

  const reminder = store.addReminder(title, {
    list: flags['--list'],
    due,
    notes: flags['--notes'],
    priority: flags['--priority'] || 'none'
  });

  console.log(`Added: ${reminder.id}. ${reminder.title}${reminder.due ? ` (due: ${reminder.due})` : ''} {${reminder.list}}`);
}

function cmdShow(filter, opts) {
  console.log(formatList(store.getReminders({ due: filter, completed: false }), opts));
}

function cmdCompleted(opts) {
  console.log(formatList(store.getReminders({ completed: true }), opts));
}

function cmdAll(opts) {
  console.log(formatList(store.getReminders({}), opts));
}

function parseIds(positional, usage) {
  if (!positional.length) return fail(usage);
  const ids = positional.map(value => {
    if (!/^\d+$/.test(value)) throw new Error(`Invalid id: ${value}`);
    const id = Number(value);
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Ids must be positive integers.');
    return id;
  });
  return ids;
}

function cmdComplete(positional) {
  const ids = parseIds(positional, 'Usage: remindr complete <id> [id...]');
  if (!ids) return;

  let missing = 0;
  for (const id of ids) {
    const reminder = store.completeReminder(id);
    if (reminder) console.log(`Completed: ${reminder.id}. ${reminder.title}`);
    else { console.error(`Not found: ${id}`); missing++; }
  }
  if (missing) process.exitCode = 1;
}

function cmdDelete(positional) {
  const ids = parseIds(positional, 'Usage: remindr delete <id> [id...]');
  if (!ids) return;

  let missing = 0;
  for (const id of ids) {
    const reminder = store.deleteReminder(id);
    if (reminder) console.log(`Deleted: ${reminder.id}. ${reminder.title}`);
    else { console.error(`Not found: ${id}`); missing++; }
  }
  if (missing) process.exitCode = 1;
}

function cmdEdit(positional, flags) {
  if (!positional[0] || !/^\d+$/.test(positional[0])) {
    return fail('Usage: remindr edit <id> [--title TEXT] [--list NAME] [--due DATE] [--notes TEXT] [--priority low|medium|high|none]');
  }

  const id = Number(positional[0]);
  if (!Number.isSafeInteger(id) || id <= 0) return fail('Id must be a positive integer.');

  const updates = {};
  if (flags['--title'] !== undefined) updates.title = flags['--title'];
  if (flags['--list'] !== undefined) updates.list = flags['--list'];
  if (flags['--due'] !== undefined) {
    const due = flags['--due'] === '' ? null : parseDate(flags['--due']);
    if (flags['--due'] !== '' && !due) return fail(`Invalid date: ${flags['--due']}`);
    updates.due = due;
  }
  if (flags['--notes'] !== undefined) updates.notes = flags['--notes'];
  if (flags['--priority'] !== undefined) updates.priority = flags['--priority'];

  if (!Object.keys(updates).length) {
    return fail('Nothing to update. Use --title, --list, --due, --notes, or --priority.');
  }

  const reminder = store.editReminder(id, updates);
  if (!reminder) return fail(`Not found: ${id}`);
  console.log(`Updated: ${reminder.id}. ${reminder.title}`);
}

function cmdList(positional, flags, opts) {
  if (flags['--create'] !== undefined) {
    if (store.createList(flags['--create'])) console.log(`Created list: ${String(flags['--create']).trim()}`);
    else return fail(`List already exists: ${flags['--create']}`);
    return;
  }

  if (!positional.length) {
    const lists = store.getLists();
    console.log(opts.json ? JSON.stringify(lists, null, 2) : (lists.length ? lists.map(name => `  - ${name}`).join('\n') : '  No lists.'));
    return;
  }

  const name = positional[0];

  if (flags['--rename'] !== undefined) {
    if (!store.renameList(name, flags['--rename'])) return fail(`Could not rename list: ${name}`);
    console.log(`Renamed: ${name} -> ${String(flags['--rename']).trim()}`);
    return;
  }

  if (flags['--delete'] === true) {
    if (!store.deleteList(name)) return fail(`List not found: ${name}`);
    console.log(`Deleted list: ${name}`);
    return;
  }

  console.log(formatList(store.getReminders({ list: name }), { ...opts, showList: false }));
}

function cmdHelp() {
  console.log(`remindr - local, zero-dependency CLI reminder manager

Usage:
  remindr                              Show today's reminders
  remindr today | tomorrow | week
  remindr overdue | completed | all
  remindr add "Buy milk" [options]
  remindr edit <id> [options]
  remindr complete <id> [id...]
  remindr delete <id> [id...]
  remindr list [NAME] [options]

Add/edit options:
  --title TEXT                         Reminder title
  --list NAME                          List (created automatically)
  --due DATE                            Due date/time
  --notes TEXT                          Notes
  --priority low|medium|high|none      Priority

List options:
  --create NAME                        Create a list
  --rename NAME                        Rename a list
  --delete                             Delete a list

Output:
  --json                               JSON output
  --plain                              Tab-separated output
  --quiet                              Count only

Other:
  remindr help                          Show help
  remindr version                       Show version`);
}

function cmdVersion() {
  console.log(`remindr v${pkg.version}`);
}

function parseArgs(args) {
  const flags = {};
  const positional = [];
  let command = null;

  if (args.length && !args[0].startsWith('-')) {
    command = args[0];
    args = args.slice(1);
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (!arg.startsWith('--')) {
      positional.push(arg);
      continue;
    }

    if (BOOLEAN_FLAGS.has(arg)) {
      flags[arg] = true;
      continue;
    }

    if (!VALUE_FLAGS.has(arg)) throw new Error(`Unknown option: ${arg}`);
    if (i + 1 >= args.length || args[i + 1].startsWith('--')) {
      throw new Error(`Option ${arg} requires a value.`);
    }

    flags[arg] = args[++i];
  }

  return { command, positional, flags };
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

module.exports = { run, parseArgs };