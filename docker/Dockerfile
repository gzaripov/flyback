ARG NODE_VERSION="10.16.0"
FROM node:${NODE_VERSION}-alpine

WORKDIR /usr/src/app
RUN npm init -f && npm i flyback
COPY . /usr/src/app/

CMD node flyback.js