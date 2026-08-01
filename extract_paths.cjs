const fs = require('fs');

const svgStr = fs.readFileSync('src/features/landing/components/AnimatedMascot.tsx', 'utf8');

const pathRegex = /<path d="[^"]+" fill="([^"]+)" transform="translate\(([^,]+),([^)]+)\)"\/>/g;
let match;
let paths = [];
let idx = 0;

while ((match = pathRegex.exec(svgStr)) !== null) {
  paths.push({
    index: idx++,
    fill: match[1],
    tx: parseFloat(match[2]),
    ty: parseFloat(match[3]),
    full: match[0]
  });
}

// Save to JSON
fs.writeFileSync('paths_data.json', JSON.stringify(paths, null, 2));

console.log('Saved ' + paths.length + ' paths to paths_data.json');
