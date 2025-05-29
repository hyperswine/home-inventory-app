#!/bin/bash

# This script creates placeholder PWA icons
# You should replace these with your actual app icons

# Create a simple colored square as placeholder
create_icon() {
    local size=$1
    local filename="icon-${size}x${size}.png"

    # Create a simple colored square using ImageMagick (if available)
    # Otherwise, you'll need to manually create these icons
    if command -v magick &> /dev/null; then
        magick -size ${size}x${size} xc:'#4F46E5' -fill white -gravity center -pointsize $((size/4)) -annotate +0+0 'HI' "public/${filename}"
        echo "Created ${filename}"
    else
        echo "ImageMagick not found. Please manually create ${filename} (${size}x${size} pixels)"
    fi
}

# Create icons for different sizes
create_icon 192
create_icon 256
create_icon 384
create_icon 512

echo "PWA icon generation complete!"
echo "Note: These are placeholder icons. Please replace them with your actual app icons."
