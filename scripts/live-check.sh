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
# An occasion's page in Gujarati, and its share card (drawn with HarfBuzz): both built ahead, so a 404 here means they
# weren't.
page "/templates/wedding?lang=gu"
page /templates/wedding/gu/opengraph-image
page /wording
page /guides
page /guides/collect-rsvp-on-whatsapp

# What search engines and link previews read names the site itself: the sitemap, robots.txt and a page's canonical link.
# Right after a deploy the edge can still serve the old copy for a few seconds: try for up to a minute.
own() {
  local body attempt
  for attempt in 1 2 3 4 5 6; do
    body=$(curl -s --max-time 20 -H "Cache-Control: no-cache" "$SITE$1?t=$(date +%s)")
    if ! echo "$body" | grep -q "localhost" && echo "$body" | grep -q "$SITE"; then echo "ok    $1 names $SITE"; return; fi
    [ "$attempt" -lt 6 ] && sleep 10
  done
  if echo "$body" | grep -q "localhost"; then echo "FAIL  $1 names localhost, not $SITE (is NEXT_PUBLIC_SITE_URL set for the build?)"
  else echo "FAIL  $1 doesn't name $SITE"; fi
  fail=1
}
own /sitemap.xml
own /robots.txt
own /templates/wedding

field() { echo "$health" | python3 -c "import json,sys
try: print(json.load(sys.stdin).get('$1'))
except Exception: print('unreadable')"; }
# Right after a deploy the old site can answer for a few seconds: try for up to a minute, past any cache.
for attempt in 1 2 3 4 5 6; do
  health=$(curl -s --max-time 20 -H "Cache-Control: no-cache" "$SITE/api/health?t=$(date +%s)" || true)
  [ "$(field db)" = "ok" ] && break
  [ "$attempt" -lt 6 ] && sleep 10
done
[ "$(field db)" = "unreadable" ] && echo "health answered: $(echo "$health" | head -c 150)"
echo "health: db $(field db), errors in the last hour $(field errorsLastHour)"
if [ "$(field ok)" != "True" ] || [ "$(field db)" != "ok" ]; then
  echo "FAIL  /api/health: the site or its database isn't well"; fail=1
fi
if [ "$ERRORS" = "--errors" ] && [ "$(field errorsLastHour)" != "0" ]; then
  echo "FAIL  server errors in the last hour: see /admin, Server errors"; fail=1
fi
exit $fail
