# One-click-deploy relay on a Linux server

``` bash
wget https://raw.githubusercontent.com/SPIN-UMass/MassBrowser/master/deploy/one_click_deploy_relay_linux.sh -O one_click_deploy_relay_linux.sh
bash one_click_deploy_relay_linux.sh
```

# Manual Installation

## Node.js

Reference: https://nodejs.org/en/download/package-manager/

For Debian Stretch:
``` sh
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get install -y nodejs
```

For Redhat:
``` sh
curl --silent --location https://rpm.nodesource.com/setup_10.x | sudo bash -
sudo yum -y install nodejs
```

## Yarn

``` sh
npm install -g yarn

```

## MassBrowser

## Clone
``` sh
git clone https://github.com/SPIN-UMass/MassBrowser.git
cd MassBrowser
```

## Run MassBrowser

``` sh
yarn
yarn run watch
```

### CLI

``` sh
yarn run relay:dev
yarn run client:dev
```

### GUI

``` sh
yarn run dev:relay
yarn run dev:client
```

## More operations

For more operations on the Massbrowser, see the *scripts* section of [package.json](../package.json).
