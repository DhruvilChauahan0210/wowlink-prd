#!/usr/bin/env bash
# Is the live site well? Its main pages answer and its database is up; with --errors, also no server errors in the
# last hour (app/lib/errors.ts). Used after each deploy and every 30 minutes (.github/workflows).
# Usage: scripts/live-check.sh https://wowlink-one.vercel.app [--errors]
set -uo pipefail
SITE=${1:?Which site? scripts/live-check.sh https://… [--errors]}
ERRORS=${2:-}
fail=0

page() {
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 "$SITE$1")
  if [ "$code" = "200" ]; then echo "ok    $1"; else echo "FAIL  $1 answered $code"; fail=1; fi
}
page /
page /templates
page /create
page /api/account

health=$(curl -s --max-time 20 "$SITE/api/health" || true)
field() { echo "$health" | python3 -c "import json,sys
try: print(json.load(sys.stdin).get('$1'))
except Exception: print('unreadable')"; }
echo "health: db $(field db), errors in the last hour $(field errorsLastHour)"
if [ "$(field ok)" != "True" ] || [ "$(field db)" != "ok" ]; then
  echo "FAIL  /api/health: the site or its database isn't well"; fail=1
fi
if [ "$ERRORS" = "--errors" ] && [ "$(field errorsLastHour)" != "0" ]; then
  echo "FAIL  server errors in the last hour: see /admin, Server errors"; fail=1
fi
exit $fail
