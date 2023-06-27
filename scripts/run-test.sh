#!/usr/bin/env bash

set -eou pipefail

dir=$(dirname "$0")
source "$dir"/exports.sh

echo -e "\e[1;32mCreating services:\e[0m"
docker compose -f "$dir"/docker-compose.test.yml up -d

if [ -z ${CI+x} ]; then
  npx jest --runInBand --detectOpenHandles --forceExit
else
  npm run test:report
fi
