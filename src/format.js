function formatReminder(r, opts = {}) {
  if (opts.json) return r;

  const status = r.completed ? '[x]' : '[ ]';
  const due = r.due ? ` (due: ${r.due})` : '';
  const priority = r.priority !== 'none' ? ` [${r.priority}]` : '';
  const list = opts.showList !== false ? ` {${r.list}}` : '';

  if (opts.plain) {
    return `${r.id}\t${r.completed ? 'done' : 'pending'}\t${r.title}\t${r.list}\t${r.due || ''}\t${r.priority}`;
  }

  return `  ${r.id}. ${status} ${r.title}${due}${priority}${list}`;
}

function formatList(reminders, opts = {}) {
  if (opts.json) {
    return JSON.stringify(reminders, null, 2);
  }
  if (opts.quiet) {
    return `${reminders.length}`;
  }
  if (reminders.length === 0) {
    return '  No reminders found.';
  }
  return reminders.map(r => formatReminder(r, opts)).join('\n');
}

module.exports = { formatReminder, formatList };
