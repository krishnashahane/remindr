function formatReminder(r, opts = {}) {
  if (opts.json) return r;

  if (opts.plain) {
    return [
      r.id,
      r.completed ? 'done' : 'pending',
      sanitizeField(r.title),
      sanitizeField(r.list),
      r.due || '',
      r.priority || 'none'
    ].join('\t');
  }

  const status = r.completed ? '[x]' : '[ ]';
  const due = r.due ? ` (due: ${r.due})` : '';
  const priority = r.priority && r.priority !== 'none' ? ` [${r.priority}]` : '';
  const list = opts.showList !== false ? ` {${r.list}}` : '';

  return `  ${r.id}. ${status} ${r.title}${due}${priority}${list}`;
}

function sanitizeField(value) {
  return String(value ?? '').replace(/[\t\r\n]/g, ' ');
}

function formatList(reminders, opts = {}) {
  if (opts.json) return JSON.stringify(reminders, null, 2);
  if (opts.quiet) return String(reminders.length);
  if (reminders.length === 0) return '  No reminders found.';
  return reminders.map(r => formatReminder(r, opts)).join('\n');
}

module.exports = { formatReminder, formatList };