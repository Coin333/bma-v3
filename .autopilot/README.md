# BMA v3 Autopilot

A durable macOS background job that, **every 30 minutes**, mines the local awwwards
component packs for one idea, **adapts it to BMA's monochrome editorial design law**,
integrates it into this site, runs polish/critique passes over it, verifies it looks
tip-top, and commits it **locally** (no push).

## How it runs

- A `launchd` agent (`~/Library/LaunchAgents/com.bma.v3-autopilot.plist`) fires
  `run-iteration.sh` every 30 min. First run is ~30 min after install. It survives
  closing Claude Code / VS Code and machine reboots (runs while you are logged in).
- Each fire launches **headless Claude Code** (`claude -p`) with `ITERATION.md` as the
  task and `REGULATIONS.md` as the design law. Runs are single-file, one change each.
- Concurrency-locked (a slow run never overlaps the next), wall-clock capped (24 min),
  and self-reverting (never leaves the site half-edited).

## Files

| File                 | Role                                                                         |
| -------------------- | ---------------------------------------------------------------------------- |
| `REGULATIONS.md`     | The design law. The compliance gate every change must pass.                  |
| `ITERATION.md`       | The per-cycle task prompt (select → adapt → polish → verify → commit).       |
| `run-iteration.sh`   | The runner launchd calls. Locking, timeout, binary discovery, logging.       |
| `autopilotctl.sh`    | Control CLI: install / uninstall / pause / resume / status / run-now / logs. |
| `state/ledger.json`  | What's been consumed/added, so runs don't repeat.                            |
| `state/earliest-run` | Epoch backstop for the start delay.                                          |
| `state/PAUSED`       | If present, launchd fires no-op (created by `pause`).                        |
| `CHANGELOG.md`       | Human-readable running log of features added.                                |
| `logs/`              | Per-iteration logs + screenshots (gitignored).                               |

## Control

```bash
bash .autopilot/autopilotctl.sh status      # schedule + recent runs + ledger summary
bash .autopilot/autopilotctl.sh pause       # stop firing (stays scheduled)
bash .autopilot/autopilotctl.sh resume
bash .autopilot/autopilotctl.sh run-now     # run one iteration immediately (foreground)
bash .autopilot/autopilotctl.sh logs 80     # tail the latest iteration log
bash .autopilot/autopilotctl.sh uninstall   # remove the schedule (site untouched)
```

## Knobs

- **Model:** edit `MODEL` in `run-iteration.sh` (default `claude-sonnet-5`; set
  `claude-opus-4-8` for max quality / higher cost). Or export `BMA_AUTOPILOT_MODEL`.
- **Per-run time cap:** `MAX_MINUTES` in `run-iteration.sh` (default 24).

## Reverting a feature you dislike

Every iteration is one local commit. `git log --oneline`, then
`git revert <sha>` (or `git reset --hard <sha>` to a good point). Nothing is pushed.

## Notes / caveats

- Runs unattended with `--dangerously-skip-permissions`, scoped by CWD to `site-v3`
  and hard-guarded to never push, install deps, or edit outside the project.
- It uses your logged-in Claude Code auth (macOS Keychain). If auth expires, runs
  fail cleanly (logged, no changes) until you re-auth in Claude Code.
- Recurring cost is real: a headless model run every 30 min. Use `pause` when you
  don't want it burning cycles.
