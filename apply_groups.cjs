const fs = require('fs');

const groups = JSON.parse(fs.readFileSync('new_groups.json', 'utf8'));
const svgFile = fs.readFileSync('src/features/landing/components/AnimatedMascot.tsx', 'utf8');

let newSvg = `<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 677 369" className={className} style={{...style, overflow: "visible"}}>\n`;

for (const [groupId, paths] of Object.entries(groups)) {
  if (paths.length === 0) continue;
  newSvg += `<g id="${groupId}">\n`;
  for (const p of paths) {
    newSvg += `${p.full}\n`;
  }
  newSvg += `</g>\n`;
}
newSvg += `</svg>`;

const newContent = svgFile.replace(/<svg version="1\.1"[\s\S]*<\/svg>/, newSvg);
fs.writeFileSync('src/features/landing/components/AnimatedMascot.tsx', newContent);
console.log('Successfully updated AnimatedMascot.tsx');
