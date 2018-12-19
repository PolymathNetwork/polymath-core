#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -o errexit

# Token symbol read from args.
TOKEN_SYMBOL=$1

# Paths
CWD="$(pwd)"
WHITELIST='/data/Transfer/GTM/whitelist_data.csv'
MULTIMINT='/data/ST/multi_mint_data.csv'

# Scripts

node polymath-cli st -t $TOKEN_SYMBOL -o false -n $TOKEN_SYMBOL -d '' -D true
node polymath-cli tm -t $TOKEN_SYMBOL -w $CWD$WHITELIST
node polymath-cli stm -t $TOKEN_SYMBOL -m $CWD$MULTIMINT
