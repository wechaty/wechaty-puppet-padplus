#!/usr/bin/env bash
set -e

VERSION=$(npx pkg-jq -r .version)

if npx --package @chatie/semver semver-is-prod $VERSION; then
  NPM_TAG=latest
else
  NPM_TAG=next
fi

npm run dist
npm run pack

TMPDIR="/tmp/npm-pack-testing.$$"
mkdir "$TMPDIR"
mv *-*.*.*.tgz "$TMPDIR"
cp tests/fixtures/smoke-testing.ts "$TMPDIR"

cd $TMPDIR
npm init -y
npm install --production \
  *-*.*.*.tgz \
  @chatie/tsconfig \
  @babel/runtime@7.0.0-beta.39 \
  @types/quick-lru \
  @types/xml2js \
  clone-class \
  brolog \
  file-box \
  fs-extra \
  hot-import \
  quick-lru \
  memory-card \
  rx-queue \
  state-switch \
  "wechaty-puppet@$NPM_TAG" \
  watchdog \
  xml2js \

./node_modules/.bin/tsc \
  --esModuleInterop \
  --lib esnext \
  --noEmitOnError \
  --noImplicitAny \
  --target es6 \
  --module commonjs \
  smoke-testing.ts

node smoke-testing.js
