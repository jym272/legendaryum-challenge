#!/usr/bin/env bash

set -eou pipefail

dir=$(dirname "$0")
# docker file need variables to be exported, the values of this var actually are not used
source "$dir"/exports.sh
docker compose -f "$dir"/docker-compose.test.yml down -v