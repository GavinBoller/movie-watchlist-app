#!/bin/bash

# Script to clean up duplicate JS files that have TypeScript equivalents
# Run this if the duplicate JS files reappear after a reboot

echo "🧹 Cleaning up duplicate JS files..."

# Remove from Git tracking (if they're being tracked)
echo "📦 Removing from Git tracking..."
git rm --cached pages/*.js 2>/dev/null || true
git rm --cached pages/auth/*.js 2>/dev/null || true
git rm --cached components/**/*.js 2>/dev/null || true
git rm --cached hooks/*.js 2>/dev/null || true
git rm --cached utils/*.js 2>/dev/null || true
git rm --cached lib/*.js 2>/dev/null || true
git rm --cached middleware.js 2>/dev/null || true

# Remove from file system
echo "🗑️  Removing from file system..."
find . -name "*.js" -path "./pages/*" -not -path "./pages/api/*" -delete 2>/dev/null || true
find . -name "*.js" -path "./components/*" -delete 2>/dev/null || true
find . -name "*.js" -path "./hooks/*" -delete 2>/dev/null || true
find . -name "*.js" -path "./utils/*" -delete 2>/dev/null || true
find . -name "*.js" -path "./lib/*" -not -path "./lib/schemas/*" -delete 2>/dev/null || true
rm -f middleware.js debug-database.js 2>/dev/null || true

# Commit changes if any
if [[ $(git status --porcelain) ]]; then
    echo "💾 Committing cleanup..."
    git add -A
    git commit -m "Clean up duplicate JS files (automated cleanup)"
    echo "✅ Cleanup complete and committed!"
else
    echo "✅ No duplicate files found - already clean!"
fi

echo "🎉 All done!"
