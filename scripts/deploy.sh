#!/usr/bin/env bash

node_modules/.bin/truffle deploy --network kovan
address=$(grep build/contracts/PolymathRegistry.json -e "\"address\":" | grep -o "0[0-9a-z]*")
commitId=$(git rev-parse HEAD)
branchName=$(git rev-parse --abbrev-ref HEAD)
commitName=$(git log -1 --pretty=%B)
data='{"text":"Somebody merged a new pull request!\nBranch Name: '$branchName'\nCommit Name: '$commitName'\nCommit ID: '$commitId'\nPolymath Registry Address(Kovan): '$address'"}'
curl -X POST -H 'Content-type: application/json' --data "$data" ${SLACK_DEVNOTIFACTIONS_WH}