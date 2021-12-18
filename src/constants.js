/**
 */

  const IS_WINDOWS = process.platform.startsWith('win');
  const IS_OSX = process.platform == 'darwin';
  const IS_LINUX = !IS_WINDOWS && !IS_OSX;
  const PIO_CORE_VERSION_SPEC = '>=5.1';
  const STATUS_BAR_PRIORITY_START = 10;
  const CONFLICTED_EXTENSION_IDS = [
   'llvm-vs-code-extensions.vscode-clangd',
   'vsciot-vscode.vscode-arduino',
   'vscode-openapi',
 ];

 module.exports = {IS_LINUX, IS_OSX, IS_WINDOWS}