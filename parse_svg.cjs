const fs = require('fs');

const svgStr = fs.readFileSync('src/features/landing/components/AnimatedMascot.tsx', 'utf8');

const pathRegex = /<path d="[^"]+" fill="([^"]+)" transform="translate\(([^,]+),([^)]+)\)"\/>/g;
let match;
let paths = [];

while ((match = pathRegex.exec(svgStr)) !== null) {
  paths.push({
    fill: match[1],
    tx: parseFloat(match[2]),
    ty: parseFloat(match[3]),
    full: match[0]
  });
}

// Now let's group them by fill color and position to identify body parts
const groups = {
  coat: [],
  stethoscope: [],
  head: [],
  left_arm: [],
  right_arm: [],
  left_ear: [],
  right_ear: [],
  eyes_mouth: [],
  body: []
};

// Helper to determine if color is gray (stethoscope)
function isGray(hex) {
  // simple check: R G B are close
  const r = parseInt(hex.substring(1,3), 16);
  const g = parseInt(hex.substring(3,5), 16);
  const b = parseInt(hex.substring(5,7), 16);
  const diff = Math.max(Math.abs(r-g), Math.abs(g-b), Math.abs(r-b));
  // also check if it's not white
  return diff < 30 && r < 240 && r > 50; 
}

// Helper to determine if coat (white/very light blue)
function isCoat(hex) {
  const r = parseInt(hex.substring(1,3), 16);
  const g = parseInt(hex.substring(3,5), 16);
  const b = parseInt(hex.substring(5,7), 16);
  return r > 210 && g > 210 && b > 210;
}

// Dark blue / black for eyes
function isDark(hex) {
  const r = parseInt(hex.substring(1,3), 16);
  return r < 100;
}

paths.forEach((p, idx) => {
  if (isGray(p.fill)) {
    groups.stethoscope.push(p);
  } else if (isCoat(p.fill)) {
    groups.coat.push(p);
  } else if (isDark(p.fill) || p.fill === '#3B3B3B') {
    groups.eyes_mouth.push(p);
  } else {
    // Skin colors
    if (p.ty < 150) {
      if (p.tx < 280) groups.left_ear.push(p);
      else if (p.tx > 400) groups.right_ear.push(p);
      else groups.head.push(p);
    } else {
      if (p.tx < 330) groups.left_arm.push(p);
      else if (p.tx > 390 && p.ty < 260) groups.right_arm.push(p);
      else groups.body.push(p);
    }
  }
});

let report = '';
for (const [name, arr] of Object.entries(groups)) {
  report += `=== ${name.toUpperCase()} (${arr.length} paths) ===\n`;
  arr.forEach(p => {
    report += `tx:${p.tx} ty:${p.ty} fill:${p.fill}\n`;
  });
  report += '\n';
}

fs.writeFileSync('svg_analysis.txt', report);
console.log('Done!');
