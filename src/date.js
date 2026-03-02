function parseDate(input) {
  if (!input) return null;
  const lower = input.toLowerCase();

  if (lower === 'today') {
    return todayStr();
  }
  if (lower === 'tomorrow') {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return dateStr(d);
  }
  if (lower === 'yesterday') {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return dateStr(d);
  }

  // YYYY-MM-DD or YYYY-MM-DD HH:mm or ISO 8601
  const d = new Date(input);
  if (isNaN(d.getTime())) {
    return null;
  }
  return input;
}

function todayStr() {
  return dateStr(new Date());
}

function dateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

module.exports = { parseDate, todayStr };
