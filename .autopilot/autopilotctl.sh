#!/bin/bash
# ============================================================================
# BMA v3 Autopilot — control script
#   autopilotctl install [delay_minutes]   install + schedule (default 30m first run)
#   autopilotctl uninstall                  unload + remove the launchd job
#   autopilotctl pause | resume             stop/start firing without unscheduling
#   autopilotctl status                     schedule + recent history + ledger summary
#   autopilotctl run-now                    run one iteration right now (foreground)
#   autopilotctl logs [N]                   tail the latest iteration log
# ============================================================================
set -u

HOME="${HOME:-/Users/colinsweeney2}"
PROJECT="$HOME/Desktop/BMA/site-v3"
AP="$PROJECT/.autopilot"
LABEL="com.bma.v3-autopilot"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
RUNNER="$AP/run-iteration.sh"
UID_NUM="$(id -u)"
INTERVAL=1800   # 30 minutes

write_plist() {
  local path_env="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
  mkdir -p "$HOME/Library/LaunchAgents" "$AP/logs"
  cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>$RUNNER</string>
    <string>launchd</string>
  </array>
  <key>StartInterval</key><integer>$INTERVAL</integer>
  <key>RunAtLoad</key><false/>
  <key>ProcessType</key><string>Background</string>
  <key>LowPriorityIO</key><true/>
  <key>Nice</key><integer>5</integer>
  <key>StandardOutPath</key><string>$AP/logs/launchd.out.log</string>
  <key>StandardErrorPath</key><string>$AP/logs/launchd.err.log</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key><string>$path_env</string>
    <key>HOME</key><string>$HOME</string>
  </dict>
</dict>
</plist>
PLIST
}

load_job() {
  launchctl bootout "gui/$UID_NUM/$LABEL" 2>/dev/null || true
  if launchctl bootstrap "gui/$UID_NUM" "$PLIST" 2>/dev/null; then :; else
    launchctl unload "$PLIST" 2>/dev/null || true
    launchctl load -w "$PLIST"
  fi
  launchctl enable "gui/$UID_NUM/$LABEL" 2>/dev/null || true
}

case "${1:-status}" in
  install)
    chmod +x "$RUNNER" "$AP/autopilotctl.sh" 2>/dev/null || true
    delay_min="${2:-30}"
    echo "$(( $(date +%s) + delay_min*60 - 300 ))" > "$AP/state/earliest-run"  # backstop, ~5m under first fire
    rm -f "$AP/state/PAUSED"
    write_plist
    load_job
    echo "Installed $LABEL. First iteration in ~$delay_min min, then every 30 min."
    echo "earliest-run backstop: $(cat "$AP/state/earliest-run")  (now: $(date +%s))"
    ;;
  uninstall)
    launchctl bootout "gui/$UID_NUM/$LABEL" 2>/dev/null || launchctl unload "$PLIST" 2>/dev/null || true
    rm -f "$PLIST"
    echo "Uninstalled $LABEL (site files untouched)."
    ;;
  pause)
    touch "$AP/state/PAUSED"; echo "Paused. The job stays scheduled but each fire will no-op until 'resume'." ;;
  resume)
    rm -f "$AP/state/PAUSED"; echo "Resumed." ;;
  run-now)
    echo "Running one iteration in the foreground (bypasses start delay)..."
    exec /bin/bash "$RUNNER" manual ;;
  status)
    echo "== launchd =="
    launchctl print "gui/$UID_NUM/$LABEL" 2>/dev/null | grep -Ei "state|last exit|runs|program|interval" | sed 's/^/  /' \
      || echo "  not loaded"
    [ -f "$AP/state/PAUSED" ] && echo "  PAUSED flag present (firing is a no-op)"
    echo "== earliest-run backstop =="; echo "  $(cat "$AP/state/earliest-run" 2>/dev/null || echo none)  (now $(date +%s))"
    echo "== recent history =="; tail -n 8 "$AP/logs/history.log" 2>/dev/null | sed 's/^/  /' || echo "  (none yet)"
    echo "== ledger =="
    if command -v python3 >/dev/null; then
      python3 - "$AP/state/ledger.json" <<'PY' 2>/dev/null || echo "  (unreadable)"
import json,sys
d=json.load(open(sys.argv[1]))
print(f"  iterations: {d.get('iterations',0)}  consumed: {len(d.get('consumed',{}))}  features: {len(d.get('added_features',[]))}")
for f in d.get('added_features',[])[-5:]:
    print(f"   - #{f.get('iteration')}: {f.get('title')}  [{f.get('commit','')}]")
PY
    fi
    ;;
  logs)
    latest="$(ls -1t "$AP/logs"/iteration-*.log 2>/dev/null | head -1)"
    [ -n "$latest" ] && { echo "== $latest =="; tail -n "${2:-60}" "$latest"; } || echo "no iteration logs yet"
    ;;
  *)
    echo "usage: autopilotctl {install [delay_min]|uninstall|pause|resume|status|run-now|logs [N]}" ;;
esac
