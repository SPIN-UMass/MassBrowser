# General Testing Step

## yarn run watch

Fistly, open a terminal and cd into the root dir of MassBrowser:
```sh
cd MassBrowser
```
Then start the auto-compilation program:
```sh
yarn run watch
```
Note that we can leave this terminal open and this program running so that whenver there is any changes to the source code, it will help you compile it on the fly!

## Run MassBrowser

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

## Helpful testing website

MassBrowser uses different censorship circumvention strategy based on the domain user would like to access. Therefore, it would be helpful when you are trying to test a specific circumnvetion strategy. To do the testing, first run the MassBrowser and then try to open a website below. The ouput and degbugging information can be seen from the console.

### Vanilla Proxy

Vanilla proxy is actually letting client connect to the website directly.

`ww.baidu.com` is under vanilla proxy policy and is uncensored. The output should be similar to:

    debug: New socks connection to www.baidu.com:443 using policy 'vanilla_proxy'


### CacheBrowsing

`cnn.com` is accessible with CacheBrowsing. The output should be similar to:

    debug: New socks connection to cdn.cnn.com:443 using policy 'cachebrowse'

### Mass Buddies

`www.youtube.com` is accessible with the help of Mass Buddies, which are also known as yaler proxies. The output should be similar to:

    debug: New socks connection to www.youtube.com:443 using policy 'yaler_proxy'
    debug: Assigning session for www.youtube.com of category Video Streaming
    debug: Searching sessions for Video Streaming
    debug: Sessions for Video Streaming Assigned
    debug: Relay [VAJKfsSLK] assigned for connection
