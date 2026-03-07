const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const outFile = path.join(rootDir, 'datasnap-pro.zip');

if (!fs.existsSync(distDir)) {
  console.error('dist/ folder not found. Run npm run build first.');
  process.exit(1);
}
console.log('Zipping dist/ folder...');
try {
  execSync(`cd "${distDir}" && zip -r "${outFile}" .`, { stdio: 'inherit' });
  console.log(`Created ${outFile}`);
} catch (err) {
  // Fallback using node
  console.log('zip command not available, trying node-based approach...');
  console.error(err.message);
}
