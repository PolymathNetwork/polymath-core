#!/usr/bin/env bash

mv truffle-config.js truffle-config-bk.js
cp truffle-config-gas.js truffle-config.js

scripts/test.sh

mv truffle-config-bk.js truffle-config.js