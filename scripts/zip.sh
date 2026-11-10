#!/bin/sh
# Writes iso.zip for a Claude app upload: the committed skill/ folder as iso/ at the archive's top level.
set -e
cd "$(dirname "$0")/.."
out=${1:-iso.zip}
git archive --format=zip --prefix=iso/ -o "$out" HEAD:skill
entries=$(unzip -Z1 "$out")
stray=$(printf '%s\n' "$entries" | grep -v '^iso/' || true)
[ -z "$stray" ] || { echo "$out has entries outside iso/:"; echo "$stray"; exit 1; }
printf '%s\n' "$entries" | grep -qx 'iso/SKILL.md' || { echo "$out has no iso/SKILL.md"; exit 1; }
echo "$out: $(printf '%s\n' "$entries" | wc -l | tr -d ' ') entries, $(wc -c < "$out" | tr -d ' ') bytes"
