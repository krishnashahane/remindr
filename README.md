# remindr

A fast, zero-dependency CLI for managing local reminders and tasks.

remindr stores reminder data locally in `~/.remindr/reminders.json`. There is no account, server, database, cloud sync, or third-party runtime dependency.

## Requirements

- Node.js 14+

## Installation

Clone the repository and link the CLI:

```bash
git clone https://github.com/krishnashahane/remindr.git
cd remindr
npm link
```

Verify:

```bash
remindr version
remindr --version
```

Run directly from the repository without installing globally:

```bash
node bin/remindr.js help
```

## Usage

```bash
remindr
remindr add "Buy groceries"
remindr add "Team standup" --list Work --due tomorrow --priority high --notes "Bring the report"
remindr today
remindr tomorrow
remindr week
remindr overdue
remindr completed
remindr all
```

## Commands

| Command | Purpose |
| --- | --- |
| `remindr` / `today` | Show open reminders due today |
| `tomorrow` | Show open reminders due tomorrow |
| `week` | Show open reminders due within the next 7 days |
| `overdue` | Show open reminders whose due date is before today |
| `completed` | Show completed reminders |
| `all` | Show all reminders |
| `add` | Create a reminder |
| `edit` | Update a reminder |
| `complete` | Mark reminders complete |
| `delete` | Delete reminders |
| `list` | List or manage reminder lists |
| `help` / `-h` / `--help` | Show help |
| `version` / `-v` / `--version` | Show the installed version |

Aliases `upcoming`, `done`, and `rm` remain supported for compatibility.

## Add and edit options

```text
--title TEXT
--list NAME
--due DATE
--notes TEXT
--priority low|medium|high|none
```

Examples:

```bash
remindr add "Pay electricity bill" --due 2026-12-01 --priority high
remindr edit 3 --title "Pay electricity bill" --priority high
remindr edit 3 --due tomorrow
remindr edit 3 --due ""
remindr edit 3 --notes ""
```

An empty `--due` or `--notes` value clears that field.

## Date formats

Supported forms:

| Format | Example |
| --- | --- |
| Relative | `today`, `tomorrow`, `yesterday` |
| Date | `2026-04-15` |
| Local date/time | `2026-04-15 14:30` |
| ISO 8601 | `2026-04-15T14:30:00.000Z` |

Invalid calendar dates and invalid local times are rejected.

## Lists

```bash
remindr list
remindr list Work
remindr list --create Projects
remindr list Work --rename Office
remindr list Work --delete
```

List matching and duplicate prevention are case-insensitive.

The `Default` list is always preserved and cannot be deleted or renamed. Deleting a custom list also deletes the reminders assigned to it.

## Output formats

```bash
remindr today --json
remindr today --plain
remindr today --quiet
```

- `--json` prints reminder objects as JSON.
- `--plain` prints tab-separated records suitable for shell pipelines.
- `--quiet` prints only the number of matching reminders.

Plain output sanitizes tabs and line breaks inside titles/list names so one reminder remains one record.

## Data and safety

Data is stored at:

```text
~/.remindr/reminders.json
```

The data directory is created with restrictive permissions where supported, and the reminder file is written with owner-only permissions where supported.

Writes are performed through a temporary file. On platforms where an atomic rename can replace the existing file, remindr uses that path; on Windows it falls back to copying the fully written file before removing the temporary file.

The application does not make network requests or transmit reminder data.

To back up reminders, copy the JSON file. Deleting the file resets remindr to an empty store.

## Tests

```bash
npm test
```

The test suite:

- Uses only Node.js built-ins.
- Runs against a temporary data directory.
- Never modifies the user's real `~/.remindr` data.
- Covers date validation, persistence, IDs, lists, formatting, and CLI argument parsing.

## Project structure

```text
remindr/
  bin/remindr.js     CLI entry point
  src/cli.js         Argument parsing and command dispatch
  src/store.js       Local JSON persistence and reminder operations
  src/date.js        Date parsing and validation
  src/format.js      Human-readable, JSON, and plain output
  test.js            Test suite
```

## License

MIT — see [LICENSE](LICENSE).
