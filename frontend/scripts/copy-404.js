import { copyFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const buildDir = join(__dirname, '../build');
const indexPath = join(buildDir, 'index.html');
const notFoundPath = join(buildDir, '404.html');

try {
	copyFileSync(indexPath, notFoundPath);
	console.log('✓ Copied index.html to 404.html for GitHub Pages SPA routing');
} catch (error) {
	console.error('✗ Failed to copy 404.html:', error.message);
	process.exit(1);
}
