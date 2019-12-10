#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -o errexit
# set -x

# Get latest tag name
latestTag=$(git describe --tags `git rev-list --tags --max-count=1`)
versionNo=$(echo "$latestTag" | cut -b 2-6)
CORE_ROUTE=$PWD
OUTPUT_DIRECTORY="$PWD/docs/api"
mkdir -p "$OUTPUT_DIRECTORY"
# rm "$OUTPUT_DIRECTORY"/* 2> /dev/null
echo "Generating docs in $OUTPUT_DIRECTORY"
"$CORE_ROUTE"/node_modules/solidoc/cli.js "$CORE_ROUTE" "$OUTPUT_DIRECTORY" "$NO_COMPILE" en "$versionNo" '**/PolyOracle.json'