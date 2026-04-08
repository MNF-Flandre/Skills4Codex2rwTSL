const fs = require('node:fs');
const path = require('node:path');

const extensionRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(extensionRoot, '..');
const docsRoot = path.join(extensionRoot, 'resources', 'tsl-docs');
const backendRoot = path.join(extensionRoot, 'resources', 'tsl-backend');

const docs = [
  {
    label: 'TSL syntax agent skill summary',
    source: 'agent_skill_tsl_syntax.md',
    target: 'agent_skill_tsl_syntax.md',
  },
  {
    label: 'TSL function agent skill summary',
    source: 'agent_skill_tsl_functions.md',
    target: 'agent_skill_tsl_functions.md',
  },
  {
    label: 'Full Tinysoft syntax tutorial',
    source: 'tinysoft_syntax_tutorial.md',
    target: 'tinysoft_syntax_tutorial.md',
  },
  {
    label: 'Full Tinysoft function reference',
    source: 'tinysoft_functions.md',
    target: 'tinysoft_functions.md',
  },
  {
    label: 'TSL skill index',
    source: 'tsl_skills_index.json',
    target: 'tsl_skills_index.json',
  },
  {
    label: 'TSL vs Pascal pitfalls',
    source: 'tsl_vs_pascal_common_pitfalls.md',
    target: 'tsl_vs_pascal_common_pitfalls.md',
  },
  {
    label: 'Public issue/debug notes',
    source: 'issue_log_public.md',
    target: 'issue_log_public.md',
  },
  {
    label: 'Inline validation prototype docs',
    source: path.join('docs', 'tsl_inline_validation_prototype.md'),
    target: path.join('docs', 'tsl_inline_validation_prototype.md'),
  },
];

fs.rmSync(docsRoot, { recursive: true, force: true });
fs.mkdirSync(docsRoot, { recursive: true });

const manifestFiles = [];
for (const doc of docs) {
  const sourcePath = path.join(repoRoot, doc.source);
  const targetPath = path.join(docsRoot, doc.target);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Bundled doc source missing: ${sourcePath}`);
  }
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
  manifestFiles.push({
    label: doc.label,
    path: doc.target.replaceAll(path.sep, '/'),
  });
}

const manifest = {
  version: 1,
  purpose: 'Bundled TSL skill and Tinysoft technical docs for Codex handoff context.',
  files: manifestFiles,
};

fs.writeFileSync(path.join(docsRoot, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
console.log(`Bundled ${manifestFiles.length} TSL docs into ${docsRoot}`);

fs.rmSync(backendRoot, { recursive: true, force: true });
fs.mkdirSync(backendRoot, { recursive: true });

copyTree(path.join(repoRoot, 'python'), path.join(backendRoot, 'python'), shouldCopyBackendFile);
copyTree(path.join(repoRoot, 'examples'), path.join(backendRoot, 'examples'), shouldCopyBackendFile);
fs.writeFileSync(
  path.join(backendRoot, 'README_BUNDLED_BACKEND.md'),
  [
    '# Bundled TSL Workbench Backend',
    '',
    'This directory is packaged inside the VS Code extension so users do not need a separate repository checkout for lint/preflight/validate commands.',
    '',
    'Real pyTSL execution still requires a local Tinysoft/AnalyseNG Python runtime module such as TSLPy312.pyd, supplied by the user installation or SDK path.',
    '',
  ].join('\n'),
  'utf-8'
);
console.log(`Bundled Python backend into ${backendRoot}`);

function copyTree(sourceDir, targetDir, predicate) {
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Backend source directory missing: ${sourceDir}`);
  }
  fs.mkdirSync(targetDir, { recursive: true });
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    const relative = path.relative(sourceDir, sourcePath);
    if (!predicate(sourcePath, relative, entry)) {
      continue;
    }
    if (entry.isDirectory()) {
      copyTree(sourcePath, targetPath, predicate);
      continue;
    }
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
  }
}

function shouldCopyBackendFile(sourcePath, relative, entry) {
  const base = path.basename(sourcePath);
  if (base === '__pycache__' || base === '.pytest_cache' || base === '.mypy_cache') {
    return false;
  }
  if (entry.isDirectory()) {
    return true;
  }
  const ext = path.extname(base).toLowerCase();
  return ['.py', '.json', '.md', '.txt', '.tsl'].includes(ext);
}
