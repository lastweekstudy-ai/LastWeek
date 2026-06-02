const fs = require('fs');
const path = require('path');

const replacements = [
  ['#a855f7', 'var(--color-accent)'],
  ['#A855F7', 'var(--color-accent)'],
  ['#9333ea', 'var(--color-accent-hover)'],
  ['#8B5CF6', 'var(--color-accent)'],
  ['#8b5cf6', 'var(--color-accent)'],
  ['#c084fc', 'var(--color-accent-light)'],
  ['rgba(168, 85, 247,', 'rgba(var(--color-accent-rgb),'],
  ['rgba(168,85,247,', 'rgba(var(--color-accent-rgb),'],
  ['rgba(139, 92, 246,', 'rgba(var(--color-accent-rgb),'],
  ['rgba(139,92,246,', 'rgba(var(--color-accent-rgb),'],
];

// Skip these files (they intentionally define the purple theme values)
const skipFiles = new Set(['global.css']);

const skipDirs = new Set(['node_modules', '.git', 'dist', '__tests__']);

let updated = [];

function walk(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (!skipDirs.has(item)) walk(full);
    } else if (/\.(jsx|js|css)$/.test(item) && !skipFiles.has(item)) {
      let content = fs.readFileSync(full, 'utf8');
      const original = content;
      for (const [from, to] of replacements) {
        content = content.split(from).join(to);
      }
      if (content !== original) {
        fs.writeFileSync(full, content, 'utf8');
        updated.push(full);
      }
    }
  }
}

walk('src');

console.log(`Updated ${updated.length} files:`);
for (const f of updated) {
  console.log('  ' + f);
}
