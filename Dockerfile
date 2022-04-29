FROM node:16-alpine

LABEL maintainer=rob9315
LABEL name=2b2wTS

WORKDIR /srv/app

RUN apk add --no-cache git;\
apk del --no-cache git || true

COPY . /srv/app
RUN npm install

EXPOSE 8080/tcp
EXPOSE 25565/tcp

CMD npm start