const fs = require('fs');

// Create a simple SVG icon and then we'll convert it
const createSVGIcon = (size) => {
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="#4F46E5"/>
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size/4}" fill="white" text-anchor="middle" dominant-baseline="middle">HI</text>
  </svg>`;
};

// Create SVG files for each size
[192, 256, 384, 512].forEach(size => {
  const svg = createSVGIcon(size);
  fs.writeFileSync(`public/icon-${size}x${size}.svg`, svg);
  console.log(`Created icon-${size}x${size}.svg`);
});

console.log('Placeholder SVG icons created!');
console.log('Note: For production, please convert these to PNG format and use your actual app design.');
