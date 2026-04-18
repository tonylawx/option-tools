#!/bin/sh
set -eu

case "${SERVICE_NAME:-api}" in
  api)
    cd /app/backend/api
    exec bun run start
    ;;
  *)
    echo "Unknown SERVICE_NAME: ${SERVICE_NAME}" >&2
    exit 1
    ;;
esac
