#!/bin/sh

set -ex
yarn run prisma:generate
yarn run prisma:seed
yarn run start
