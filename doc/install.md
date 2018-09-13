# Install dependencies

## Node.js

Reference: https://nodejs.org/en/download/package-manager/

For Debian Stretch:
``` sh
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## Yarn

``` sh
npm install -g yarn

```

# MassBrowser

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
