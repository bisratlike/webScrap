const { execSync } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
console.log('Building DataSnap Pro...');
try {
  execSync('npx webpack --config webpack.config.js', { cwd: rootDir, stdio: 'inherit' });
  console.log('Build complete! Output in dist/');
} catch (err) {
  console.error('Build failed:', err.message);
  process.exit(1);
}
