#!/usr/bin/env bash

set -e

rm -rf build/candidate build/built-with-candidate

node lib/build.js src/build.js build/candidate --compiler=node

node build/candidate/build.js src/build.js build/built-with-candidate -c node

diff build/candidate build/built-with-candidate

if [ $? -ne 0 ]; then
  echo "Build failed"
  exit 1
fi

rm -rf build/built-with-candidate build/old_lib

mv lib build/old_lib
mv build/candidate lib
