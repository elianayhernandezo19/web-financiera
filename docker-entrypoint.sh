#!/bin/sh
# =============================================================================
# docker-entrypoint.sh — runtime environment injection
#
# Runs as the non-root "nginx" user before nginx starts.
#
# What it does:
#   Replaces the literal placeholder "$API_URL" inside env.js with the value
#   of the API_URL environment variable supplied at docker run / docker-compose.
#
# Why envsubst with an explicit variable list?
#   Without the list, envsubst would attempt to substitute every $VAR it finds
#   in the file. nginx config snippets and Angular build artifacts can contain
#   dollar signs that must NOT be touched. The explicit list '${API_URL}'
#   limits substitution to exactly that one variable.
# =============================================================================
set -e

ENV_FILE="/usr/share/nginx/html/env.js"

# Substitute only $API_URL; write to /tmp to avoid permission race, then move
envsubst '${API_URL}' < "$ENV_FILE" > /tmp/env.js
cp /tmp/env.js "$ENV_FILE"

# Hand off to CMD ("nginx -g 'daemon off;'")
exec "$@"
