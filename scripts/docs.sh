#!/usr/bin/env bash

# Exit script as soon as a command fails.
set -o errexit

# Global variables
DIRECTORY=polymath-core-docs
WEBSITE_DIRECTORY=versioned_docs
CORE_ROUTE=$PWD

# functions that used to create the documentation
create_docs() {

    # getting the all available branches 
    if [ "$(git branch | grep -w $latestTag)" == "" ];
    then
    # Checkout and create the $latestTag branch
    git checkout -b $latestTag

    if [ ! -d $WEBSITE_DIRECTORY ]; then
    mkdir $WEBSITE_DIRECTORY
    fi

    echo "Creating the new docs for the version "$latestTag""
    cd $WEBSITE_DIRECTORY

    # Creating the new directory with name $latestTag
    mkdir $latestTag
    fi

    echo "Generating the API documentation in branch $latestTag"
    # Command to generate the documentation using the solidity-docgen
    migrate=$(SOLC_ARGS="openzeppelin-solidity="$CORE_ROUTE"/node_modules/openzeppelin-solidity" \
solidity-docgen $CORE_ROUTE $CORE_ROUTE/contracts $HOME/tmp/polymath-core-docs/docs)
    echo "Successfully docs are generated..."
    echo "Transferring the API DOCS to $latestTag directory"
    mv ../../docs/api_* $latestTag 

    # Commit the changes
    echo "Commiting the new changes..."
    git add .
    git commit -m "create new api docs for $latestTag" > /dev/null 2>&1
    git push origin $latestTag > /dev/null 2>&1

    # Remove the repository
    echo "Removing the repository from the system...."
    cd ../../../../
    rm -rf polymath-core-docs
    exit 1 
}

reject_docs() {
    echo "$latestTag docs are already exist into the $DIRECTORY"
    exit 1
}

echo "Checking the latest tag branch merge on masters"

# Get new tags from remote
git fetch --tags > /dev/null 2>&1

# Get latest tag name
latestTag=$(git describe --tags `git rev-list --tags --max-count=1`)
versionNo=$(echo "$latestTag" | cut -b 2-6)

#print the tag
echo "Latest tag is: $latestTag"

# clone the polymath-core-docs
cd ~/tmp

if [ ! -d $DIRECTORY ]; then
git clone https://github.com/PolymathNetwork/polymath-core-docs.git  > /dev/null 2>&1
cd $DIRECTORY
else
cd $DIRECTORY
git pull  > /dev/null 2>&1
fi

cd docs/website

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
            echo "$(basename "$dir")"
            if [ "$(basename "$dir")" == "$latestTag" ]; then
                reject_docs 
            fi
        fi 
    done
    create_docs
fi

#reponame=$(echo $(basename "$dir") | cut -d '-' -f2 | cut -b 2-6)
#            echo $reponame
