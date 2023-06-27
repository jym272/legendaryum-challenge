#!/usr/bin/env bash

set -eou pipefail

dir=$(dirname "$0")
source "$dir"/random_functions.sh

redis_port=$(get_random_port_not_used)

#docker
export COMPOSE_PROJECT_NAME=legendaryum-api-test

#redis
export REDIS_HOST=localhost
export REDIS_PORT=$redis_port
