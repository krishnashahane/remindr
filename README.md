# remindr

Cross-platform CLI reminder tool. Works on macOS, Windows, and Linux.

Zero dependencies. Stores reminders locally in `~/.remindr/reminders.json`.

## Install

```bash
git clone https://github.com/krishnashahane/remindr.git
cd remindr
npm link
```

## Usage

```bash
remindr                              # show today's reminders
remindr today                        # show today
remindr tomorrow                     # show tomorrow
remindr week                         # show this week
remindr overdue                      # show overdue
remindr completed                    # show completed
remindr all                          # show all

remindr add "Buy milk"
remindr add --title "Call mom" --list Personal --due tomorrow
remindr edit 1 --title "New title" --due 2026-03-10
remindr complete 1 2 3
remindr delete 4

remindr list                         # show all lists
remindr list Work                    # show reminders in list
remindr list --create Projects       # create a list
remindr list Work --rename Office    # rename
remindr list Work --delete           # delete
```

## Output formats

- `--json` JSON output
- `--plain` tab-separated
- `--quiet` count only

## Date formats

Accepted by `--due` and date filters:
- `today`, `tomorrow`, `yesterday`
- `YYYY-MM-DD`
- `YYYY-MM-DD HH:mm`
- ISO 8601

## Run tests

```bash
npm test
```

## License

MIT
