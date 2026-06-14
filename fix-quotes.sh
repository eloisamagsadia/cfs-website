#!/bin/bash
# Usage: ./fix-quotes.sh path/to/file.tsx
sed -i '' "s/\\\\'/'/" "$1"
echo "Fixed: $1"
