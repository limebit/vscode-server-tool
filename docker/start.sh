#!/bin/sh

set -ex
git config --global user.name $GIT_NAME
git config --global user.email '<>'
code-server /root/$REPOSITORY
