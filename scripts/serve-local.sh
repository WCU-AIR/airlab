#!/usr/bin/env bash

set -euo pipefail

readonly ENV_NAME="airlab-jekyll"
readonly REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "${REPO_ROOT}"

if ! command -v conda >/dev/null 2>&1; then
  echo "Conda is required but was not found on PATH." >&2
  exit 1
fi

BUNDLER_VERSION="$(
  awk '/^BUNDLED WITH$/ { getline; gsub(/^[[:space:]]+/, ""); print; exit }' Gemfile.lock
)"
RUBY_BINDIR="$(
  conda run --name "${ENV_NAME}" \
    ruby -rrbconfig -e 'print RbConfig::CONFIG.fetch("bindir")'
)"

# This mirrors build-site.yaml's production Jekyll command. The repository
# base path is fixed locally because configure-pages only runs on GitHub.
exec conda run --no-capture-output --name "${ENV_NAME}" \
  env -u BUNDLE_PATH JEKYLL_ENV=production \
  "${RUBY_BINDIR}/bundle" "_${BUNDLER_VERSION}_" exec jekyll serve \
  --baseurl "/airlab" \
  --host "127.0.0.1" \
  --port "4004" \
  --livereload-port "35734" \
  --livereload
