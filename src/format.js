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
  const title = sanitizeField(r.title);
  const due = r.due ? ` (due: ${sanitizeField(r.due)})` : '';
  const priority = r.priority && r.priority !== 'none' ? ` [${sanitizeField(r.priority)}]` : '';
  const list = opts.showList !== false ? ` {${sanitizeField(r.list)}}` : '';

  return `  ${r.id}. ${status} ${title}${due}${priority}${list}`;
}

function sanitizeField(value) {
  return String(value ?? '').replace(/[\u0000-\u001F\u007F]/g, ' ');
}

function formatList(reminders, opts = {}) {
  if (opts.json) return JSON.stringify(reminders, null, 2);
  if (opts.quiet) return String(reminders.length);
  if (reminders.length === 0) return '  No reminders found.';
  return reminders.map(r => formatReminder(r, opts)).join('\n');
}

module.exports = { formatReminder, formatList };