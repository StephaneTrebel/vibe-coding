import { writeFileSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const basePath = process.env.BASE_PATH || '';
const templatePath = join(__dirname, '../static/manifest.json.template');
const outputPath = join(__dirname, '../static/manifest.json');

try {
  const template = readFileSync(templatePath, 'utf-8');
  const manifest = template.replace(/\$\{BASE_PATH\}/g, basePath);
  
  writeFileSync(outputPath, manifest);
  console.log(`✓ Generated manifest.json with BASE_PATH="${basePath}"`);
} catch (error) {
  console.error('✗ Failed to generate manifest.json:', error.message);
  process.exit(1);
}
