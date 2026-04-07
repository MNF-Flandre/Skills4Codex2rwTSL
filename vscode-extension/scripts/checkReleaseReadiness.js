const fs = require('node:fs');
const path = require('node:path');

const extensionRoot = path.resolve(__dirname, '..');
const packageJsonPath = path.join(extensionRoot, 'package.json');
const readmePath = path.join(extensionRoot, 'README.md');
const troubleshootingPath = path.join(extensionRoot, 'TROUBLESHOOTING.md');

const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const failures = [];
const warnings = [];

if (!pkg.publisher || String(pkg.publisher).includes('todo')) {
  failures.push('`publisher` is still placeholder. Set a real Marketplace publisher before formal release.');
}

if (!pkg.icon) {
  failures.push('`icon` is missing in package.json.');
} else {
  const iconPath = path.join(extensionRoot, pkg.icon);
  if (!fs.existsSync(iconPath)) {
    failures.push(`Icon file not found: ${pkg.icon}`);
  } else {
    const stat = fs.statSync(iconPath);
    if (stat.size < 1024) {
      warnings.push(`Icon file looks too small (${stat.size} bytes). Verify quality for Marketplace.`);
    }
  }
}

if (!fs.existsSync(readmePath)) {
  failures.push('README.md is missing.');
}
if (!fs.existsSync(troubleshootingPath)) {
  failures.push('TROUBLESHOOTING.md is missing.');
}

if (!pkg.galleryBanner) {
  warnings.push('`galleryBanner` is missing; consider adding for consistent Marketplace branding.');
}
if (pkg.preview !== true) {
  warnings.push('`preview` is not true; if this is still hardened beta, keep preview=true.');
}

if (warnings.length > 0) {
  console.warn('[release-check] warnings:');
  for (const warning of warnings) {
    console.warn(`- ${warning}`);
  }
}

if (failures.length > 0) {
  console.error('[release-check] failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('[release-check] passed: required Marketplace readiness gates are satisfied.');

