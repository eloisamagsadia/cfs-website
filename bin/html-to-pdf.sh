#!/usr/bin/env bash
# Convert an HTML file to PDF using headless Chrome on macOS.
# Usage: bin/html-to-pdf.sh docs/plans/foo.html
# Output: docs/plans/foo.pdf (same dir, same basename)

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "usage: $0 <input.html> [output.pdf]" >&2
  exit 1
fi

INPUT="$1"
OUTPUT="${2:-${INPUT%.html}.pdf}"

if [ ! -f "$INPUT" ]; then
  echo "error: $INPUT not found" >&2
  exit 1
fi

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [ ! -x "$CHROME" ]; then
  echo "error: Google Chrome not found at $CHROME" >&2
  exit 1
fi

ABS_INPUT="$(cd "$(dirname "$INPUT")" && pwd)/$(basename "$INPUT")"

"$CHROME" \
  --headless=new \
  --disable-gpu \
  --no-pdf-header-footer \
  --virtual-time-budget=10000 \
  --print-to-pdf="$OUTPUT" \
  "file://$ABS_INPUT" 2>&1 | grep -v "ERROR:base/process" || true

if [ ! -f "$OUTPUT" ]; then
  echo "error: PDF generation failed" >&2
  exit 1
fi

echo "wrote $OUTPUT"
