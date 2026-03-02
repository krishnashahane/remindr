const store = require('./store');
const { formatList } = require('./format');
const { parseDate } = require('./date');

function run(args) {
  const { command, positional, flags } = parseArgs(args);
  const opts = {
    json: flags['--json'] || false,
    plain: flags['--plain'] || false,
    quiet: flags['--quiet'] || false,
  };

  try {
    switch (command) {
      case 'add':
        cmdAdd(positional, flags);
        break;
      case 'show':
      case 'today':
        cmdShow('today', opts);
        break;
      case 'tomorrow':
        cmdShow('tomorrow', opts);
        break;
      case 'week':
        cmdShow('week', opts);
        break;
      case 'overdue':
        cmdShow('overdue', opts);
        break;
      case 'upcoming':
        cmdShow('week', opts);
        break;
      case 'completed':
      case 'done':
        cmdCompleted(opts);
        break;
      case 'all':
        cmdAll(opts);
        break;
      case 'complete':
        cmdComplete(positional);
        break;
      case 'delete':
      case 'rm':
        cmdDelete(positional, flags);
        break;
      case 'edit':
        cmdEdit(positional, flags);
        break;
      case 'list':
      case 'lists':
        cmdList(positional, flags, opts);
        break;
      case 'help':
      case '--help':
      case '-h':
        cmdHelp();
        break;
      case 'version':
      case '--version':
      case '-v':
        cmdVersion();
        break;
      default:
        if (!command) {
          cmdShow('today', opts);
        } else {
          // check if it's a date
          const d = parseDate(command);
          if (d) {
            const reminders = store.getReminders({ completed: false });
            const filtered = reminders.filter(r => r.due && r.due.startsWith(d.slice(0, 10)));
            console.log(formatList(filtered, opts));
          } else {
            console.error(`Unknown command: ${command}`);
            console.error('Run "remindr help" for usage.');
            process.exit(1);
          }
        }
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

function cmdAdd(positional, flags) {
  const title = flags['--title'] || positional[0];
  if (!title) {
    console.error('Usage: remindr add "title" [--list NAME] [--due DATE] [--notes TEXT] [--priority low|medium|high]');
    process.exit(1);
  }
  const due = flags['--due'] ? parseDate(flags['--due']) : null;
  if (flags['--due'] && !due) {
    console.error(`Invalid date: ${flags['--due']}`);
    process.exit(1);
  }
  const r = store.addReminder(title, {
    list: flags['--list'],
    due,
    notes: flags['--notes'],
    priority: flags['--priority'] || 'none',
  });
  console.log(`Added: ${r.id}. ${r.title}${r.due ? ' (due: ' + r.due + ')' : ''} {${r.list}}`);
}

function cmdShow(filter, opts) {
  const reminders = store.getReminders({ due: filter, completed: false });
  console.log(formatList(reminders, opts));
}

function cmdCompleted(opts) {
  const reminders = store.getReminders({ completed: true });
  console.log(formatList(reminders, opts));
}

function cmdAll(opts) {
  const reminders = store.getReminders({});
  console.log(formatList(reminders, opts));
}

function cmdComplete(positional) {
  if (positional.length === 0) {
    console.error('Usage: remindr complete <id> [id...]');
    process.exit(1);
  }
  for (const raw of positional) {
    const id = parseInt(raw, 10);
    if (isNaN(id)) {
      console.error(`Invalid id: ${raw}`);
      continue;
    }
    const r = store.completeReminder(id);
    if (r) {
      console.log(`Completed: ${r.id}. ${r.title}`);
    } else {
      console.error(`Not found: ${raw}`);
    }
  }
}

function cmdDelete(positional, flags) {
  if (positional.length === 0) {
    console.error('Usage: remindr delete <id> [--force]');
    process.exit(1);
  }
  for (const raw of positional) {
    const id = parseInt(raw, 10);
    if (isNaN(id)) {
      console.error(`Invalid id: ${raw}`);
      continue;
    }
    const r = store.deleteReminder(id);
    if (r) {
      console.log(`Deleted: ${r.id}. ${r.title}`);
    } else {
      console.error(`Not found: ${raw}`);
    }
  }
}

function cmdEdit(positional, flags) {
  const id = parseInt(positional[0], 10);
  if (isNaN(id)) {
    console.error('Usage: remindr edit <id> [--title TEXT] [--list NAME] [--due DATE] [--notes TEXT] [--priority low|medium|high]');
    process.exit(1);
  }
  const updates = {};
  if (flags['--title']) updates.title = flags['--title'];
  if (flags['--list']) updates.list = flags['--list'];
  if (flags['--due']) {
    const d = parseDate(flags['--due']);
    if (!d) {
      console.error(`Invalid date: ${flags['--due']}`);
      process.exit(1);
    }
    updates.due = d;
  }
  if (flags['--notes']) updates.notes = flags['--notes'];
  if (flags['--priority']) updates.priority = flags['--priority'];

  if (Object.keys(updates).length === 0) {
    console.error('Nothing to update. Use --title, --list, --due, --notes, or --priority.');
    process.exit(1);
  }

  const r = store.editReminder(id, updates);
  if (r) {
    console.log(`Updated: ${r.id}. ${r.title}`);
  } else {
    console.error(`Not found: ${id}`);
    process.exit(1);
  }
}

function cmdList(positional, flags, opts) {
  if (flags['--create']) {
    const name = flags['--create'];
    if (store.createList(name)) {
      console.log(`Created list: ${name}`);
    } else {
      console.error(`List already exists: ${name}`);
    }
    return;
  }

  if (positional.length > 0) {
    const name = positional[0];

    if (flags['--rename']) {
      if (store.renameList(name, flags['--rename'])) {
        console.log(`Renamed: ${name} -> ${flags['--rename']}`);
      } else {
        console.error(`List not found: ${name}`);
      }
      return;
    }

    if (flags['--delete']) {
      if (store.deleteList(name)) {
        console.log(`Deleted list: ${name}`);
      } else {
        console.error(`List not found: ${name}`);
      }
      return;
    }

    // show reminders in list
    const reminders = store.getReminders({ list: name });
    console.log(formatList(reminders, { ...opts, showList: false }));
    return;
  }

  // show all lists
  const lists = store.getLists();
  if (opts.json) {
    console.log(JSON.stringify(lists, null, 2));
  } else {
    if (lists.length === 0) {
      console.log('  No lists.');
    } else {
      lists.forEach(l => console.log(`  - ${l}`));
    }
  }
}

function cmdHelp() {
  console.log(`remindr - Cross-platform CLI reminder tool

Usage:
  remindr                              Show today's reminders
  remindr today                        Show today
  remindr tomorrow                     Show tomorrow
  remindr week                         Show this week
  remindr overdue                      Show overdue
  remindr completed                    Show completed
  remindr all                          Show all reminders

  remindr add "Buy milk"               Add a reminder
  remindr add --title "Call" --list Work --due tomorrow
  remindr edit <id> --title "New"      Edit a reminder
  remindr complete <id> [id...]        Mark as done
  remindr delete <id>                  Delete a reminder

  remindr list                         Show all lists
  remindr list Work                    Show reminders in list
  remindr list --create Work           Create a list
  remindr list Work --rename Office    Rename a list
  remindr list Work --delete           Delete a list

Options:
  --json                               Output as JSON
  --plain                              Tab-separated output
  --quiet                              Count only

  remindr help                         Show this help
  remindr version                      Show version`);
}

function cmdVersion() {
  const pkg = require('../package.json');
  console.log(`remindr v${pkg.version}`);
}

function parseArgs(args) {
  const flags = {};
  const positional = [];
  let command = null;

  let i = 0;
  if (args.length > 0 && !args[0].startsWith('-')) {
    command = args[0];
    i = 1;
  }

  while (i < args.length) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      // boolean flags
      if (arg === '--json' || arg === '--plain' || arg === '--quiet' || arg === '--force' || arg === '--delete') {
        flags[arg] = true;
      } else if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        flags[arg] = args[i + 1];
        i++;
      } else {
        flags[arg] = true;
      }
    } else {
      positional.push(arg);
    }
    i++;
  }

  return { command, positional, flags };
}

module.exports = { run };
