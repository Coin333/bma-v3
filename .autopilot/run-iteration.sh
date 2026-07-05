#!/bin/bash
# ============================================================================
# BMA v3 Autopilot — iteration runner
# Called by launchd every 30 min (and by autopilotctl run-now).
# Runs ONE headless Claude Code iteration against site-v3, fully unattended.
# ----------------------------------------------------------------------------
# Usage: run-iteration.sh [launchd|manual]
#   launchd (default): honors the earliest-run start delay.
#   manual:            bypasses the start delay (for `autopilotctl run-now`).
# ============================================================================
set -u

# ---- User-editable knobs ---------------------------------------------------
# Model for the unattended run. Sonnet 5 is the cost-sane default and is very
# capable for this monochrome editorial work. Bump to "claude-opus-4-8" (or
# "claude-opus-4-8[1m]") for maximum quality at materially higher cost.
MODEL="${BMA_AUTOPILOT_MODEL:-claude-sonnet-5}"
# Hard wall-clock cap per iteration (minutes). Keep < 30 so runs never overlap.
MAX_MINUTES="${BMA_AUTOPILOT_MAX_MINUTES:-24}"
# ---------------------------------------------------------------------------

SOURCE="${1:-launchd}"
HOME="${HOME:-/Users/colinsweeney2}"
export HOME
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

PROJECT="$HOME/Desktop/BMA/site-v3"
AP="$PROJECT/.autopilot"
COMPONENTS_DIR="$HOME/Desktop/Awwwards Components"
ITER_FILE="$AP/ITERATION.md"
LOCK="$AP/locks/run.lock"
HISTORY="$AP/logs/history.log"
SCRATCH="$(mktemp -d "${TMPDIR:-/tmp}/bma-autopilot.XXXXXX")"
STAMP="$(date +%Y%m%d-%H%M%S)"
LOG="$AP/logs/iteration-$STAMP.log"

mkdir -p "$AP/logs" "$AP/locks"

log()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG"; }
note() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$HISTORY"; }

# ---- 1. Start-delay guard (launchd only) ----------------------------------
if [ "$SOURCE" = "launchd" ] && [ -f "$AP/state/earliest-run" ]; then
  EARLIEST="$(cat "$AP/state/earliest-run" 2>/dev/null || echo 0)"
  NOW="$(date +%s)"
  if [ "$NOW" -lt "$EARLIEST" ]; then
    note "skip: before earliest-run ($EARLIEST); now=$NOW"
    rm -rf "$SCRATCH"; exit 0
  fi
fi

# ---- 1b. Pause flag -------------------------------------------------------
if [ "$SOURCE" = "launchd" ] && [ -f "$AP/state/PAUSED" ]; then
  note "skip: paused"
  rm -rf "$SCRATCH"; exit 0
fi

# ---- 2. Concurrency lock (atomic mkdir + stale-PID reclaim) ---------------
if ! mkdir "$LOCK" 2>/dev/null; then
  PID="$(cat "$LOCK/pid" 2>/dev/null || echo '')"
  if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
    note "skip: iteration already running (pid $PID)"
    rm -rf "$SCRATCH"; exit 0
  fi
  note "clearing stale lock (pid=${PID:-none})"
  rm -rf "$LOCK"; mkdir "$LOCK" 2>/dev/null || { note "skip: could not take lock"; rm -rf "$SCRATCH"; exit 0; }
fi
echo "$$" > "$LOCK/pid"
cleanup() { rm -rf "$LOCK" "$SCRATCH" 2>/dev/null; }
trap cleanup EXIT INT TERM

# ---- 3. Locate the claude binary ------------------------------------------
CLAUDE_BIN=""
for c in "$HOME/.local/bin/claude" "$(command -v claude 2>/dev/null || true)" \
         /opt/homebrew/bin/claude /usr/local/bin/claude; do
  if [ -n "$c" ] && [ -x "$c" ]; then CLAUDE_BIN="$c"; break; fi
done
if [ -z "$CLAUDE_BIN" ]; then
  CLAUDE_BIN="$(ls -t "$HOME"/.vscode/extensions/anthropic.claude-code-*/resources/native-binary/claude 2>/dev/null | head -1 || true)"
fi
if [ -z "$CLAUDE_BIN" ] || [ ! -x "$CLAUDE_BIN" ]; then
  log "FATAL: claude binary not found on PATH or in the VS Code extension."
  note "fail: claude binary not found"
  exit 1
fi

if [ ! -d "$PROJECT/.git" ]; then
  log "FATAL: $PROJECT is not a git repo (need it for local commits)."
  note "fail: project not a git repo"; exit 1
fi

# ---- 4. Run one iteration, headless, with a wall-clock watchdog -----------
cd "$PROJECT" || { log "FATAL: cannot cd to $PROJECT"; exit 1; }
MAX_SECONDS=$(( MAX_MINUTES * 60 ))
GUARDRAIL="You are an UNATTENDED background job. Hard rules: only edit files under \
$PROJECT; never run git push or touch any remote; never install dependencies or add \
third-party libraries; obey $AP/REGULATIONS.md exactly (monochrome, hairlines-not-shadows, \
tiny motion budget, vanilla only); make at most ONE small reversible change; if anything \
fails or is uncertain, restore the working tree (git checkout -- .) and make no change. \
Commit locally only. Scratch dir for unzip/temp: $SCRATCH."

log "iteration start | source=$SOURCE | model=$MODEL | cap=${MAX_MINUTES}m | bin=$CLAUDE_BIN"
note "start ($SOURCE, $MODEL)"

TMPDIR="$SCRATCH" "$CLAUDE_BIN" -p "$(cat "$ITER_FILE")" \
  --model "$MODEL" \
  --append-system-prompt "$GUARDRAIL" \
  --permission-mode bypassPermissions \
  --dangerously-skip-permissions \
  --add-dir "$COMPONENTS_DIR" \
  --add-dir "$SCRATCH" \
  >>"$LOG" 2>&1 &
CLAUDE_PID=$!

( sleep "$MAX_SECONDS"; kill -TERM "$CLAUDE_PID" 2>/dev/null; sleep 20; kill -KILL "$CLAUDE_PID" 2>/dev/null ) &
WATCHDOG_PID=$!

wait "$CLAUDE_PID"; STATUS=$?
kill "$WATCHDOG_PID" 2>/dev/null; wait "$WATCHDOG_PID" 2>/dev/null

# ---- 5. Safety net: never leave the tree half-edited ----------------------
# The iteration is instructed to commit or self-revert. If it exited nonzero AND
# left uncommitted changes to tracked source files, discard them so the next run
# starts clean. (The .autopilot ledger/changelog are allowed to stay dirty.)
if [ "$STATUS" -ne 0 ]; then
  DIRTY="$(git -C "$PROJECT" status --porcelain -- ':!.autopilot/logs' | grep -v '^?? .autopilot/' || true)"
  if [ -n "$DIRTY" ]; then
    log "iteration exited $STATUS with a dirty tree; restoring tracked files to HEAD."
    git -C "$PROJECT" checkout -- . 2>>"$LOG" || true
  fi
fi

# ---- 6. Rotate logs & record ----------------------------------------------
ls -1t "$AP/logs"/iteration-*.log 2>/dev/null | tail -n +61 | xargs rm -f 2>/dev/null || true
LAST_COMMIT="$(git -C "$PROJECT" log -1 --oneline 2>/dev/null || echo 'n/a')"
log "iteration end | exit=$STATUS | HEAD=$LAST_COMMIT"
note "end   exit=$STATUS HEAD=$LAST_COMMIT"
exit 0
