#!/bin/sh

set -ex
yarn run prisma:generate
yarn run prisma:db:push
yarn run prisma:db:seed
yarn run start
