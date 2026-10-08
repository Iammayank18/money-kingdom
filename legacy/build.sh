#!/usr/bin/env bash
# Joins src/ parts (in order) into index.html. Run: ./build.sh
cd "$(dirname "$0")"
{
  echo '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
  cat src/1-markup.html src/2-helpers.html src/3-characters.html src/4-scene.html src/5-app.html
  echo '</html>'
} > index.html
echo "index.html updated"
