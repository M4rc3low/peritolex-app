import { existsSync, readFileSync } from 'node:fs';

const requiredFiles = [
  'index.html',
  'src/main.jsx',
  'src/api/peritolexClient.js',
  'Dockerfile',
  '.github/workflows/ci.yml'
];

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    throw new Error(`Required file not found: ${file}`);
  }
}

const client = readFileSync('src/api/peritolexClient.js', 'utf8');

if (!client.includes('peritolexApi')) {
  throw new Error('Local client export not found: peritolexApi');
}

if (!client.includes('peritolex_')) {
  throw new Error('Local storage namespace not found: peritolex_');
}

console.log('Smoke test passed: PeritoLex structure is valid.');
