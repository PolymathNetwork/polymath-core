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

if ! [ -z "${TRAVIS_PULL_REQUEST+x}" ] && [ "$TRAVIS_PULL_REQUEST" != false ]; then
  testrpc_port=8545
else
  testrpc_port=8545
fi

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

  if ! [ -z "${TRAVIS_PULL_REQUEST+x}" ] && [ "$TRAVIS_PULL_REQUEST" != false ]; then
    node_modules/.bin/testrpc-sc --gasLimit 0xfffffffffff --port "$testrpc_port" "${accounts[@]}" > /dev/null &
  else
    node_modules/.bin/ganache-cli --gasLimit 0xfffffffffff "${accounts[@]}" > /dev/null &
  fi
  

  testrpc_pid=$!
}

if testrpc_running; then
  echo "Using existing testrpc instance"
  bridge_running
  if bridge_running; then
    echo "Using existing ethereum-bridge instance"
  else
    echo "Runnning the new ethereum-bridge instance"
    start_bridge
  fi
else
  echo "Starting our own testrpc instance"
  start_testrpc
  echo "Starting our own ethereum-bridge instance"
  sleep 10
  start_bridge
fi

if ! [ -z "${TRAVIS_PULL_REQUEST+x}" ] && [ "$TRAVIS_PULL_REQUEST" != false ]; then
  node_modules/.bin/solidity-coverage

  if [ "$CONTINUOUS_INTEGRATION" = true ]; then
    cat coverage/lcov.info | node_modules/.bin/coveralls
  fi
else
  node_modules/.bin/truffle test `ls test/*.js`
fi
