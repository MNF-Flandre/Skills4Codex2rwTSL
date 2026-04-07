const path = require('node:path');
const { runTests } = require('@vscode/test-electron');

async function main() {
  const extensionDevelopmentPath = path.resolve(__dirname, '..');
  const extensionTestsPath = path.resolve(__dirname, '../out/test/integration/extensionHost.js');
  const workspacePath = path.resolve(__dirname, '../test-fixtures/clean-workspace');
  const backendRoot = path.resolve(__dirname, '../..');

  await runTests({
    extensionDevelopmentPath,
    extensionTestsPath,
    launchArgs: [workspacePath, '--disable-extensions'],
    extensionTestsEnv: {
      TSL_TEST_BACKEND_ROOT: backendRoot,
    },
  });
}

main().catch((error) => {
  const message = error && error.message ? String(error.message) : String(error);
  const networkBlocked =
    message.includes('ENOTFOUND') || message.includes('update.code.visualstudio.com') || message.includes('ECONNREFUSED');
  if (networkBlocked && process.env.TSL_STRICT_INTEGRATION_TESTS !== '1') {
    console.warn('[warn] Extension Host integration tests skipped: VS Code test binary download unavailable.');
    console.warn('[warn] To enforce failure on download/setup problems, set TSL_STRICT_INTEGRATION_TESTS=1.');
    return;
  }
  console.error(error);
  process.exit(1);
});
