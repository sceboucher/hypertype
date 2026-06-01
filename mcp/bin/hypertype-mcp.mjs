#!/usr/bin/env node
// Default (no args): start the stdio MCP server — this is what MCP clients spawn.
// `install`: wire the server into local tools and install the skill.
// `help`: usage.
const arg = process.argv[2];

if (arg === 'install') {
  const { runInstaller } = await import('../src/install.mjs');
  await runInstaller(process.argv.slice(3));
} else if (arg === 'help' || arg === '--help' || arg === '-h') {
  console.log(`hypertype MCP server (${'@sceboucher/hypertype'})

Usage:
  npx @sceboucher/hypertype            Start the stdio MCP server (what MCP clients run)
  npx @sceboucher/hypertype install    Configure the server in your tools + install the skill
  npx @sceboucher/hypertype install --print        Show what install would do (dry run)
  npx @sceboucher/hypertype install --client cursor  Target one client
  npx @sceboucher/hypertype help       This message`);
} else {
  const { startStdio } = await import('../src/server.mjs');
  startStdio().catch((e) => {
    console.error(`hypertype-mcp failed to start: ${e.message}`);
    process.exit(1);
  });
}
