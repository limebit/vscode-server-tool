#!/bin/sh

set -ex
yarn run prisma:generate
yarn run start
