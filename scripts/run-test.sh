#!/usr/bin/env bash

set -eou pipefail

dir=$(dirname "$0")
source "$dir"/exports.sh

echo -e "\e[1;32mCreating services:\e[0m"
docker compose -f "$dir"/docker-compose.test.yml up -d
# if CI is set, then we are running in a CI environment, and exe npm run test:report insted
if [ -z ${CI+x} ]; then
  npm run test
else
  npm run test:report
fi
