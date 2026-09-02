#!/usr/bin/env bash
# Build and publish ShapeTrader to GitHub Pages.
#
#   bash scripts/deploy-pages.sh
#
# GitHub Pages serves a project site from https://<user>.github.io/<repo>/, so
# the bundle is built with that prefix (DEPLOY_BASE) and React Router picks the
# same prefix up from import.meta.env.BASE_URL.
set -euo pipefail

REPO_NAME="${REPO_NAME:-shapetrader}"
BRANCH="gh-pages"

cd "$(dirname "$0")/.."

echo "→ typecheck"
npx tsc --noEmit

echo "→ build (base=/$REPO_NAME/)"
DEPLOY_BASE="$REPO_NAME" npx vite build

# Pages has no SPA rewrite rule. Serving the same document as 404.html means a
# hard refresh on /simulator still boots the app, which then routes correctly.
# Fail loudly rather than publishing a bundle whose asset paths are wrong —
# a broken deploy is much harder to spot than a failed one.
if ! grep -q "\"/$REPO_NAME/assets/" dist/index.html; then
  echo "✗ built asset paths are not under /$REPO_NAME/ — refusing to publish" >&2
  grep -oE '(src|href)="[^"]*"' dist/index.html | head -5 >&2
  exit 1
fi

cp dist/index.html dist/404.html
# Stops Pages running the output through Jekyll, which ignores _-prefixed files.
touch dist/.nojekyll

echo "→ publish $BRANCH"
rm -rf .deploy
git worktree remove .deploy --force 2>/dev/null || true
git worktree prune
# Left over from an interrupted run — the orphan branch name must be free.
git branch -D "$BRANCH-tmp" 2>/dev/null || true
git worktree add --detach .deploy
cp -r dist/. .deploy/
cd .deploy
git checkout --orphan "$BRANCH-tmp"
git add -A
git commit -q -m "Deploy ShapeTrader $(date -u +%Y-%m-%dT%H:%MZ)"
git push -f origin "HEAD:$BRANCH"
cd ..
git worktree remove .deploy --force

echo "✓ deployed"
