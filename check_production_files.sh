#!/bin/bash

echo "🔍 Checking Production File Safety..."
echo "=================================="

# Check if critical production files exist
CRITICAL_FILES=(
    "server/.env.production"
    "client/.env.production"  
    "ecosystem.config.js"
)

MISSING_FILES=()

for file in "${CRITICAL_FILES[@]}"; do
    if [[ ! -f "$file" ]]; then
        MISSING_FILES+=("$file")
    fi
done

if [[ ${#MISSING_FILES[@]} -gt 0 ]]; then
    echo "⚠️  WARNING: Missing critical production files:"
    for file in "${MISSING_FILES[@]}"; do
        echo "   - $file"
    done
    echo ""
    echo "Please ensure these files exist before deploying!"
    exit 1
else
    echo "✅ All critical production files are present"
fi

# Check if any critical files are tracked by git
echo ""
echo "🔍 Checking git tracking status..."

TRACKED_CRITICAL=$(git ls-files | grep -E "\.(env|log)$|ecosystem\.config\.js$" || true)

if [[ -n "$TRACKED_CRITICAL" ]]; then
    echo "⚠️  WARNING: Critical files are being tracked by git:"
    echo "$TRACKED_CRITICAL"
    echo ""
    echo "Consider removing them with: git rm --cached <filename>"
else
    echo "✅ No critical files are being tracked by git"
fi

echo ""
echo "🏁 Production file check complete!"
