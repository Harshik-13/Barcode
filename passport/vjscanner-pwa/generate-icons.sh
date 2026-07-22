#!/bin/bash

# PWA Icon Generator Script
# Generates icons using ImageMagick convert command

SIZES=(72 96 128 144 152 192 384 512)
OUTPUT_DIR="public/icons"
TEMP_SVG="/tmp/icon.svg"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Create SVG template
cat > "$TEMP_SVG" << 'EOF'
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="512" height="512" fill="url(#grad)"/>
  
  <!-- QR Scanner corners -->
  <g stroke="white" stroke-width="40" fill="none" stroke-linecap="round">
    <!-- Top-left -->
    <path d="M 100 250 L 100 100 L 250 100"/>
    <!-- Top-right -->
    <path d="M 262 100 L 412 100 L 412 250"/>
    <!-- Bottom-left -->
    <path d="M 100 262 L 100 412 L 250 412"/>
    <!-- Bottom-right -->
    <path d="M 262 412 L 412 412 L 412 262"/>
  </g>
  
  <!-- Scan line -->
  <rect x="125" y="246" width="262" height="20" fill="white"/>
</svg>
EOF

echo "Generating PWA icons..."
echo ""

# Check if ImageMagick is available
if command -v convert &> /dev/null; then
  # Generate icons using ImageMagick
  for size in "${SIZES[@]}"; do
    convert -background none "$TEMP_SVG" -resize ${size}x${size} "$OUTPUT_DIR/icon-${size}.png"
    echo "✓ Generated icon-${size}.png (${size}x${size})"
  done
  rm "$TEMP_SVG"
  echo ""
  echo "✨ All icons generated successfully using ImageMagick!"
elif command -v rsvg-convert &> /dev/null; then
  # Generate icons using rsvg-convert (alternative)
  for size in "${SIZES[@]}"; do
    rsvg-convert -w $size -h $size "$TEMP_SVG" -o "$OUTPUT_DIR/icon-${size}.png"
    echo "✓ Generated icon-${size}.png (${size}x${size})"
  done
  rm "$TEMP_SVG"
  echo ""
  echo "✨ All icons generated successfully using rsvg-convert!"
else
  # No converter available, just copy the SVG
  echo "⚠️  Neither ImageMagick nor rsvg-convert found."
  echo "    Saving SVG template instead. You can:"
  echo "    1. Install ImageMagick: sudo apt install imagemagick"
  echo "    2. Install librsvg: sudo apt install librsvg2-bin"
  echo "    3. Use an online converter to create PNGs from the SVG"
  echo ""
  cp "$TEMP_SVG" "$OUTPUT_DIR/icon.svg"
  echo "📄 SVG template saved to: $OUTPUT_DIR/icon.svg"
fi

echo "📁 Icons location: $OUTPUT_DIR"
