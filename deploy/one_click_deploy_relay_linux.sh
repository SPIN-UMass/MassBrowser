#!/bin/bash

set -x

log_name="$(date +%Y-%m-%d-%H-%M-%S).log"

touch "$log_name"

if [ -f /etc/debian_version ]; then
    echo "This is Debian based distro" | tee "$log_name"
    # update and install dependencies
    sudo apt-get update && sudo apt-get upgrade -y
    sudo apt-get install -y curl git build-essential
    # install nodejs: https://nodejs.org/en/download/package-manager/
    curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
    sudo apt-get install -y nodejs
elif [ -f /etc/redhat-release ]; then
    echo "This is RedHat based distro" | tee "$log_name"
    # update and install dependencies
    sudo yum update && sudo yum -y upgrade
    sudo yum -y install curl git gcc-c++ make
    # install nodejs: https://nodejs.org/en/download/package-manager/
    sudo yum -y install nodejs
    curl --silent --location https://rpm.nodesource.com/setup_10.x | sudo bash -
else
    echo "[ERROR] Unsupported distribution" | tee "$log_name"
    exit 1
fi

# install yarn

npm install -g yarn

# clone MassBrowser
if [ ! -d MassBrowser ]; then
    git clone https://github.com/SPIN-UMass/MassBrowser.git
fi

cd MassBrowser

# build MassBrowser
yarn

# TODO: need to escape from the result
yarn run watch

# run proxy
yarn run relay:dev &
