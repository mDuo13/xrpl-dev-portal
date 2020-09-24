#!/bin/bash

## Run from the root directory of the repo to build all languages
## TODO: read the `-o` / `--out` argument and adapt it for non-en languages

# Pass forward dactyl "vars" arg if provided
if [ "$1" == "--vars" ] && [ -n "$2" ];
then
  dactyl_vars=$2
  shift 2
fi

dactyl_build --vars "$dactyl_vars" -S -o .
dactyl_build -t ja -o ./ja --vars "$dactyl_vars"
