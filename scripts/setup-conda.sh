#!/usr/bin/env bash

set -euo pipefail

readonly ENV_NAME="airlab-jekyll"
readonly REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "${REPO_ROOT}"

if ! command -v conda >/dev/null 2>&1; then
  echo "Conda is required but was not found on PATH." >&2
  exit 1
fi

# Updating also creates the environment when it does not exist.
conda env update --name "${ENV_NAME}" --file environment.yml --prune

# ruby/setup-ruby uses the Bundler version recorded in Gemfile.lock.
BUNDLER_VERSION="$(
  awk '/^BUNDLED WITH$/ { getline; gsub(/^[[:space:]]+/, ""); print; exit }' Gemfile.lock
)"

if [[ -z "${BUNDLER_VERSION}" ]]; then
  echo "Could not determine the Bundler version from Gemfile.lock." >&2
  exit 1
fi

RUBY_BINDIR="$(
  conda run --name "${ENV_NAME}" \
    ruby -rrbconfig -e 'print RbConfig::CONFIG.fetch("bindir")'
)"

# Conda's RubyGems executable directory is under share/rubygems. Wrappers
# installed there incorrectly look for Ruby beside themselves, so install
# Bundler beside Conda's actual Ruby executable instead.
conda run --name "${ENV_NAME}" \
  gem install bundler \
    --version "${BUNDLER_VERSION}" \
    --bindir "${RUBY_BINDIR}" \
    --force \
    --no-document

# The lockfile's legacy posix-spawn release predates modern macOS Clang,
# which treats one of its callback signatures as an error by default.
RUBY_PLATFORM="$(
  conda run --name "${ENV_NAME}" ruby -e 'print RUBY_PLATFORM'
)"
if [[ "${RUBY_PLATFORM}" == *darwin* ]]; then
  POSIX_SPAWN_VERSION="$(
    awk '$1 == "posix-spawn" && $2 ~ /^\([0-9]/ {
      gsub(/[()]/, "", $2)
      print $2
      exit
    }' Gemfile.lock
  )"
  conda run --name "${ENV_NAME}" \
    gem install posix-spawn \
      --version "${POSIX_SPAWN_VERSION}" \
      --bindir "${RUBY_BINDIR}" \
      --no-document \
      -- \
      --with-cflags=-Wno-error=incompatible-function-pointer-types
fi

conda run --name "${ENV_NAME}" \
  env -u BUNDLE_PATH \
  "${RUBY_BINDIR}/bundle" "_${BUNDLER_VERSION}_" install

printf '\nSetup complete. Start the local site with:\n  ./scripts/serve-local.sh\n'
