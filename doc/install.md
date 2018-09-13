* Install dependencies

** Node.js

Reference: https://nodejs.org/en/download/package-manager/

On Debian Stretch:
``` sh
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get install -y nodejs
```

** Misc

``` sh
sudo apt-get install -y yarn
```

* Compile MassBrowser

``` sh
git clone https://github.com/SPIN-UMass/MassBrowser.git
cd MassBrowser
npm install -g yarn
yarn

yarn run watch
```

* Run MassBrowser

** CLI

``` sh
yarn run relay:dev
yarn run client:dev
```

** GUI

``` sh
GUI -> yarn run dev:relay
GUI -> yarn run dev:client
```
