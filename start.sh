#!/bin/sh

set -ex
yarn run prisma:generate
yarn run prisma:db:push
yarn run prisma:seed
yarn run start
