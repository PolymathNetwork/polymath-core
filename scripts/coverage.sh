#!/usr/bin/env bash

rm -rf flat

COVERAGE=true POLYMATH_NATIVE_SOLC=true scripts/test.sh
