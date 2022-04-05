#!/bin/sh

set -ex
yarn run prisma:generate
yarn run prisma:db:push
node --require ./node_modules/dotenv/config ./prisma-build/seed.js
yarn run start
