<p align="center">
  <h1 align="center">🔔 remindr</h1>
  <p align="center">A fast, zero-dependency CLI reminder tool that works everywhere.</p>
</p>

<p align="center">
  <a href="#installation">Installation</a> &bull;
  <a href="#usage">Usage</a> &bull;
  <a href="#commands">Commands</a> &bull;
  <a href="#output-formats">Output Formats</a> &bull;
  <a href="#license">License</a>
</p>

---

**remindr** is a lightweight command-line reminder and task manager built with Node.js. No databases, no cloud sync, no dependencies — just your reminders stored locally in `~/.remindr/reminders.json`.

### Why remindr?

- **Zero dependencies** — nothing to install, nothing to break
- **Cross-platform** — works on macOS, Windows, and Linux
- **Fast** — no startup overhead, instant results
- **Organized** — group reminders into custom lists
- **Flexible output** — human-readable, JSON, or tab-separated for scripting
- **Portable data** — plain JSON file you can back up, sync, or edit by hand

## Installation

### From source

```bash
git clone https://github.com/krishnashahane/remindr.git
cd remindr
npm link
```

### Verify installation

```bash
remindr version
```

> Requires Node.js 14 or later.

## Usage

```bash
# Show today's reminders (default)
remindr

# Add a quick reminder
remindr add "Buy groceries"

# Add with details
remindr add "Team standup" --list Work --due tomorrow --priority high

# Mark as done
remindr complete 1

# See what's overdue
remindr overdue
```

## Commands

### Viewing reminders

| Command              | Description                |
|----------------------|----------------------------|
| `remindr`            | Show today's reminders     |
| `remindr today`      | Show today's reminders     |
| `remindr tomorrow`   | Show tomorrow's reminders  |
| `remindr week`       | Show this week's reminders |
| `remindr overdue`    | Show overdue reminders     |
| `remindr completed`  | Show completed reminders   |
| `remindr all`        | Show all reminders         |

### Managing reminders

```bash
# Add a reminder
remindr add "Title"
remindr add "Title" --list Work --due 2026-04-01 --priority high --notes "Details here"

# Edit a reminder
remindr edit <id> --title "Updated title"
remindr edit <id> --due tomorrow --priority medium

# Complete one or more reminders
remindr complete <id> [id...]

# Delete a reminder
remindr delete <id>
```

### Managing lists

```bash
# Show all lists
remindr list

# Show reminders in a specific list
remindr list Work

# Create a new list
remindr list --create Projects

# Rename a list
remindr list Work --rename Office

# Delete a list (removes all reminders in it)
remindr list Work --delete
```

### Options for `add` and `edit`

| Flag                  | Description                              |
|-----------------------|------------------------------------------|
| `--title "text"`      | Reminder title                           |
| `--list Name`         | Assign to a list (created automatically) |
| `--due DATE`          | Set a due date                           |
| `--notes "text"`      | Add notes                                |
| `--priority low\|medium\|high` | Set priority level              |

## Date Formats

The `--due` flag and date filters accept:

| Format             | Example                    |
|--------------------|----------------------------|
| Relative           | `today`, `tomorrow`, `yesterday` |
| Date               | `2026-04-15`               |
| Date and time      | `2026-04-15 14:30`         |
| ISO 8601           | `2026-04-15T14:30:00.000Z` |

## Output Formats

Control how remindr displays results:

```bash
# Default: human-readable
remindr today

# JSON (great for piping to jq)
remindr today --json

# Tab-separated (great for awk, cut, spreadsheets)
remindr today --plain

# Count only
remindr today --quiet
```

### Examples

**Default output:**
```
  1. [ ] Buy groceries (due: 2026-03-21) {Personal}
  2. [ ] Team standup (due: 2026-03-21) [high] {Work}
```

**JSON output:**
```json
[
  {
    "id": 1,
    "title": "Buy groceries",
    "list": "Personal",
    "due": "2026-03-21",
    "priority": "none",
    "completed": false
  }
]
```

## Data Storage

All data is stored in a single JSON file at:

```
~/.remindr/reminders.json
```

To back up your reminders, simply copy this file. To reset, delete it — remindr will create a fresh one on next use.

## Running Tests

```bash
npm test
```

## Project Structure

```
remindr/
  bin/remindr.js     Entry point
  src/cli.js         Command parsing and execution
  src/store.js       Data persistence (JSON file)
  src/format.js      Output formatting
  src/date.js        Date parsing utilities
  test.js            Test suite
```

## Author

**Krishna Shahane** — [github.com/krishnashahane](https://github.com/krishnashahane)

## License

[MIT](LICENSE)
