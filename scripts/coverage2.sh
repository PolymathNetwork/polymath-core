#!/usr/bin/env bash

# Global variable
bridge_pid

# Exit script as soon as a command fails.
set -o errexit

# Executes cleanup function at script exit.
trap cleanup EXIT

cleanup() {
  # Kill the testrpc instance that we started (if we started one and if it's still running).
  if [ -n "$bridge_pid" ] && ps -p $bridge_pid > /dev/null; then
      kill -9 $bridge_pid
  fi
  if [ -n "$testrpc_pid" ] && ps -p $testrpc_pid > /dev/null; then
    kill -9 $testrpc_pid
  fi
}

testrpc_port=8545

testrpc_running() {
  nc -z localhost "$testrpc_port"
}

bridge_running() {
  if [ $(ps -eaf | grep -c ethereum-bridge) -ge 2 ]; then
    return 0
  else
    return 1
  fi
}

start_bridge() {
  # Run the ethereum-bridge to make oraclize query run
  node_modules/.bin/ethereum-bridge -H localhost:8545 -a 9 --dev >/dev/null 2>&1 &
  sleep 10
  bridge_pid=$!
  echo "Ethereum-bridge is successfully running as process id ${bridge_pid}"
}

start_testrpc() {
  # We define 10 accounts with balance 1M ether, needed for high-value tests.
  local accounts=(
    --account="0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501200,1000000000000000000000000"
    --account="0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501201,1000000000000000000000000"
    --account="0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501202,1000000000000000000000000"
    --account="0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501203,1000000000000000000000000"
    --account="0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501204,1000000000000000000000000"
    --account="0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501205,1000000000000000000000000"
    --account="0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501206,1000000000000000000000000"
    --account="0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501207,1000000000000000000000000"
    --account="0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501208,1000000000000000000000000"
    --account="0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501209,1000000000000000000000000"
  )
  node_modules/.bin/testrpc-sc --gasLimit 0xfffffffffff --port "$testrpc_port" "${accounts[@]}" > /dev/null &

  testrpc_pid=$!
}

if testrpc_running; then
  echo "Using existing testrpc instance"
  # Do not start ethereum bridge unless it is a cron job
  if [ "$CIRCLE_CI_CRON" = true ]; then
    bridge_running
    if bridge_running; then
      echo "Using existing ethereum-bridge instance"
    else
      echo "Runnning the new ethereum-bridge instance"
      start_bridge
    fi
  fi
else
  echo "Starting our own testrpc instance"
  start_testrpc
  # Do not start ethereum bridge unless it is a cron job
  if [ "$CIRCLE_CI_CRON" = true ]; then
    echo "Starting our own ethereum-bridge instance"
    sleep 10
    start_bridge
  fi
fi


curl -o node_modules/solidity-coverage/lib/app.js https://raw.githubusercontent.com/maxsam4/solidity-coverage/relative-path/lib/app.js
if [ "$CIRCLECI" = true ] || [ "$TRAVIS_PULL_REQUEST" > 0 ] && [ "$NOT_FORK" != true ]; then
  export COVERALLS_PARALLEL=true
  mv .solcover2.js .solcover.js
fi
node_modules/.bin/solidity-coverage
if [ "$CIRCLECI" = true ] || [ "$TRAVIS_PULL_REQUEST" > 0 ] && [ "$NOT_FORK" != true ]; then
  cat coverage/lcov.info | node_modules/.bin/coveralls || echo 'Failed to report coverage to Coveralls'
fi
if [ "$CIRCLECI" = true ]; then
  echo 'sleeping for 5 minutes to make sure first coverage completes. Blame circleci for not supporting webhooks in workflows'
  sleep 5m
  curl -k https://coveralls.io/webhook?repo_token=$COVERALLS_REPO_TOKEN -d "payload[build_num]=$CIRCLE_BUILD_NUM&payload[status]=done"
fi
