#!/bin/sh
# Prints and fails on any banned name in tracked files or file names. The bracketed letters keep this file from matching itself.
cd "$(dirname "$0")/.." || exit 1
pattern='v[o]id|v[i]te|r[o]lldown|o[x]c'
hits=$({ git grep -niE "$pattern"; git ls-files | grep -iE "$pattern"; } | grep -vE '^skill/lib/[a-z.]+\.ts:[0-9]+:.*(\):|=>) v[o]id')
if [ -n "$hits" ]; then
  echo "$hits"
  echo "A banned name is in the lines above. For a function type that returns nothing, write '=> unknown' (that empty return type is allowed only in skill/lib)."
  exit 1
fi
echo "names ok"
