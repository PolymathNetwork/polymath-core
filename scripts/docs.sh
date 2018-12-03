#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -o errexit

# Global variables
DIRECTORY=polymath-developer-portal
WEBSITE_DIRECTORY=versioned_docs
CORE_ROUTE=$PWD


# functions that used to create the documentation
create_docs() {

    # getting the all available branches 
    if [ "$(git branch | grep -w $latestTag)" == "" ];
    then
    # Check whether the branch is already present or not
    if [ "$(git branch -r | grep "origin/$latestTag" | wc -l)" -ge 1 ];
    then 
    echo "$latestTag Branch is already present on remote"
    exit 0
    fi
    # Checkout and create the $latestTag branch
    git checkout -b $latestTag

    if [ ! -d $WEBSITE_DIRECTORY ]; then
    mkdir $WEBSITE_DIRECTORY
    fi

    echo "Creating the new docs for the version "$latestTag""
    cd $WEBSITE_DIRECTORY
    fi

    echo "Fetching solc binary"
    curl -L -o solidity-ubuntu-trusty.zip https://github.com/ethereum/solidity/releases/download/v0.4.24/solidity-ubuntu-trusty.zip
    unzip solidity-ubuntu-trusty.zip
    CWD=$(pwd)
    OLD_SOLC_PATH=$SOLC_PATH
    export SOLC_PATH=$CWD/solc

    echo "Generating the API documentation in branch $latestTag"
    # Command to generate the documentation using the solidity-docgen

    migrate=$(SOLC_ARGS="openzeppelin-solidity="$CORE_ROUTE"/node_modules/openzeppelin-solidity" \
solidity-docgen -x external/oraclizeAPI.sol,mocks/MockPolyOracle.sol,oracles/PolyOracle.sol $CORE_ROUTE $CORE_ROUTE/contracts $CORE_ROUTE/polymath-developer-portal/)
    
    export SOLC_PATH=$OLD_SOLC_PATH

    echo "Successfully docs are generated..."
    
    echo "Installing npm dependencies..."
    yarn install > /dev/null 2>&1
    
    echo "Gererate versioning docs..."
    yarn run version $versionNo

    # Commit the changes
    echo "Commiting the new changes..."
    git add .
    #git commit -m "create new api docs for $latestTag" > /dev/null 2>&1
    #git push origin $latestTag > /dev/null 2>&1
    git commit -m "create new api docs for $latestTag"
    git push origin $latestTag

    # Remove the repository
    echo "Removing the repository from the system...."
    cd ../../../
    rm -rf polymath-developer-portal
    exit 0 
}

reject_docs() {
    echo "$latestTag docs are already exist into the $DIRECTORY"
    exit 0
}

echo "Checking the latest tag branch merge on masters"

# Get new tags from remote
git fetch --tags > /dev/null 2>&1

# Get latest tag name
latestTag=$(git describe --tags `git rev-list --tags --max-count=1`)
versionNo=$(echo "$latestTag" | cut -b 2-6)

#print the tag
echo "Latest tag is: $latestTag"

# clone the polymath-developer-portal

if [ ! -d $DIRECTORY ]; then
git clone https://${GH_USR}:${GH_PWD}@github.com/PolymathNetwork/polymath-developer-portal.git  > /dev/null 2>&1 
cd $DIRECTORY
else
cd $DIRECTORY
git checkout master > /dev/null 2>&1
git pull origin master > /dev/null 2>&1
fi

cd website

if [ ! -d $WEBSITE_DIRECTORY ]; then
echo "Created: versioned_docs directory"
create_docs 
else 
    for dir in $WEBSITE_DIRECTORY/*; 
    do
        if [ "$(basename "$dir")" == "*" ]; then
        echo "There is no version specific folders"
        create_docs
        else
            reponame=$(echo $(basename "$dir") | cut -d '-' -f2)
            echo $reponame
            if [ "$reponame" == "$versionNo" ]; then
                reject_docs 
            fi
        fi 
    done
    create_docs
fi

#reponame=$(echo $(basename "$dir") | cut -d '-' -f2 | cut -b 2-6)
#            echo $reponame