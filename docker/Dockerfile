FROM ubuntu:latest
ARG relay_port

WORKDIR /relay

RUN apt-get update
RUN apt-get install -y curl

RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get install nodejs

RUN npm install -g yarn

COPY relay.js .
COPY package.json .

RUN yarn install
RUN npm install pm2 -g

EXPOSE $relay_port

CMD ["pm2-docker", "relay.js"]

