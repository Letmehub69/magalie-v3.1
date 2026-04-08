#!/usr/bin/env node
// Chercheur Runner — Research utility for codebase analysis
// Usage: node scripts/chercheur-runner.js --query "how does auth work" --scope /Users/house/clawbuddy
// Usage: node scripts/chercheur-runner.js --find "supabase client" --scope /Users/house/clawbuddy
// Usage: node scripts/chercheur-runner.js --deps "src/components/CommandDeck.tsx" --scope /Users/house/clawbuddy

require('./load-env.js');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = {};
process.argv.slice(2).forEach((arg, i, arr) => {
  if (arg.startsWith('--')) args[arg.slice(2)] = arr[i + 1] || true;
});

const scope = args.scope || process.cwd();

function searchFiles(pattern, dir) {
  try {
    const result = execSync(`grep -rn "${pattern}" "${dir}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.md" -l 2>/dev/null | head -20`, {
      encoding: 'utf8', timeout: 10000,
    });
    return result.trim().split('\n').filter(Boolean);
  } catch { return []; }
}

function getImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const imports = content.match(/(?:import|require)\s*\(?['"]([^'"]+)['"]\)?/g) || [];
    return imports.map(i => i.replace(/(?:import|require)\s*\(?['"]/, '').replace(/['"]\)?/, ''));
  } catch { return []; }
}

function analyzeStructure(dir) {
  try {
    const result = execSync(`find "${dir}" -name "*.tsx" -o -name "*.ts" -o -name "*.js" | head -50`, {
      encoding: 'utf8', timeout: 5000,
    });
    const files = result.trim().split('\n').filter(Boolean);
    const dirs = [...new Set(files.map(f => path.dirname(f).replace(dir, '')))].sort();
    return { files: files.length, directories: dirs };
  } catch { return { files: 0, directories: [] }; }
}

console.log('🧪 CHERCHEUR — Research Agent');
console.log(`Scope: ${scope}\n`);

if (args.query || args.find) {
  // Search mode
  const pattern = args.query || args.find;
  console.log(`Searching: "${pattern}"\n`);

  const files = searchFiles(pattern, scope);
  if (files.length > 0) {
    console.log(`Found in ${files.length} files:`);
    files.forEach(f => {
      const relativePath = f.replace(scope + '/', '');
      // Get matching lines
      try {
        const matches = execSync(`grep -n "${pattern}" "${f}" | head -3`, { encoding: 'utf8' }).trim();
        console.log(`  ${relativePath}:`);
        matches.split('\n').forEach(m => console.log(`    ${m}`));
      } catch {
        console.log(`  ${relativePath}`);
      }
    });
  } else {
    console.log('No matches found.');
  }
} else if (args.deps) {
  // Dependency analysis mode
  const filePath = path.resolve(scope, args.deps);
  console.log(`Analyzing dependencies: ${args.deps}\n`);

  if (!fs.existsSync(filePath)) {
    console.log('❌ File not found');
    process.exit(1);
  }

  const imports = getImports(filePath);
  console.log(`Imports (${imports.length}):`);
  imports.forEach(i => {
    const isLocal = i.startsWith('.') || i.startsWith('@/');
    console.log(`  ${isLocal ? '📁' : '📦'} ${i}`);
  });

  // Reverse deps - who imports this file?
  const basename = path.basename(filePath, path.extname(filePath));
  const reverseDeps = searchFiles(basename, scope);
  console.log(`\nImported by (${reverseDeps.length} files):`);
  reverseDeps.filter(f => f !== filePath).forEach(f => {
    console.log(`  ← ${f.replace(scope + '/', '')}`);
  });
} else if (args.structure) {
  // Structure analysis
  console.log('Analyzing structure...\n');
  const { files, directories } = analyzeStructure(scope);
  console.log(`Files: ${files}`);
  console.log(`Directories:`);
  directories.forEach(d => console.log(`  ${d || '/'}`));
} else {
  console.log('Usage:');
  console.log('  --query "pattern"     Search codebase for a pattern');
  console.log('  --find "pattern"      Same as --query');
  console.log('  --deps "file.tsx"     Analyze imports and reverse dependencies');
  console.log('  --structure           Show project file structure');
  console.log('  --scope /path         Set search directory (default: cwd)');
}

console.log('\n' + JSON.stringify({
  agent: 'chercheur',
  query: args.query || args.find || args.deps || 'structure',
  scope,
  timestamp: new Date().toISOString(),
}));
