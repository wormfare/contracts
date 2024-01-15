FROM node:16-alpine as builder

RUN apk add --no-cache git ca-certificates

WORKDIR /app

COPY package.json *.lock .npmrc ./

RUN yarn --no-default-rc install

COPY . .

RUN yarn --no-default-rc run build
RUN yarn --no-default-rc run test --no-compile

ENV DOCKER=true
ENV PORT=8545
 
ENTRYPOINT ["yarn", "start"]