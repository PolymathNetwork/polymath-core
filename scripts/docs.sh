#!/usr/bin/env bash

# Global variables
DIRECTORY=polymath-core-docs
WEBSITE_DIRECTORY=versioned_docs

# functions that used to create the documentation
create_docs() {
    echo "Creating the new docs for the version "$latestTag""
    echo `$WEBSITE_DIRECTORY+"-"+$latestTag`
    mkdir $("$WEBSITE_DIRECTORY" + "-" + "$latestTag")
}

reject_docs() {
    echo "$latestTag docs are already exist into the $DIRECTORY"
    exit 1
}

# Exit script as soon as a command fails.
set -o errexit

echo "Checking the latest tag branch merge on masters"

# Get new tags from remote
git fetch --tags > /dev/null &

# Get latest tag name
latestTag=$(git describe --tags `git rev-list --tags --max-count=1`)
versionNo=$(echo "$latestTag" | cut -b 2-6)

#print the tag
echo $latestTag

# clone the polymath-core-docs
cd ~/tmp

if [ ! -d $DIRECTORY ]; then
git clone https://github.com/PolymathNetwork/polymath-core-docs.git  > /dev/null 2>&1
cd $DIRECTORY
else
cd $DIRECTORY
#git pull  > /dev/null 2>&1
fi

cd docs/website

if [ ! -d $WEBSITE_DIRECTORY ]; then
mkdir $WEBSITE_DIRECTORY
echo "Created: versioned_docs directory"
create_docs 
else 
    for dir in $WEBSITE_DIRECTORY/*; 
    do
        if [ "$(basename "$dir")" == "*" ]; then
        echo "When their is no folders"
        create_docs
        else
            echo "$(basename "$dir")"
            reponame=$(echo $(basename "$dir") | cut -d '-' -f2 | cut -b 2-6)
            echo $reponame
            if [ "$reponame" == "$versionNo" ]; then
                reject_docs 
            fi
        fi 
    done
    create_docs
fi

