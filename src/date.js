function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDate(input) {
  if (typeof input !== 'string') return null;
  const value = input.trim();
  if (!value) return null;

  const lower = value.toLowerCase();
  const now = new Date();

  if (lower === 'today') return formatDate(now);
  if (lower === 'tomorrow') {
    now.setDate(now.getDate() + 1);
    return formatDate(now);
  }
  if (lower === 'yesterday') {
    now.setDate(now.getDate() - 1);
    return formatDate(now);
  }

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    const [, year, month, day] = dateOnly.map(Number);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
    return value;
  }

  const localDateTime = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(value);
  if (localDateTime) {
    const [, year, month, day, hour, minute] = localDateTime.map(Number);
    const date = new Date(year, month - 1, day, hour, minute);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day ||
        date.getHours() !== hour || date.getMinutes() !== minute) return null;
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function todayStr() {
  return formatDate(new Date());
}

module.exports = { parseDate, todayStr };