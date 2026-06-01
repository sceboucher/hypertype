import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeMcpConfig, clientPaths } from '../src/install.mjs';

test('mergeMcpConfig adds the server to an empty/null config', () => {
  const merged = mergeMcpConfig(null);
  assert.deepEqual(merged.mcpServers.hypertype, { command: 'npx', args: ['-y', '@sceboucher/hypertype'] });
});

test('mergeMcpConfig preserves existing servers and top-level keys', () => {
  const existing = { theme: 'dark', mcpServers: { other: { command: 'foo' } } };
  const merged = mergeMcpConfig(existing);
  assert.equal(merged.theme, 'dark');
  assert.deepEqual(merged.mcpServers.other, { command: 'foo' });
  assert.ok(merged.mcpServers.hypertype);
});

test('mergeMcpConfig overwrites a stale hypertype entry, not other servers', () => {
  const existing = { mcpServers: { hypertype: { command: 'old' }, keep: { command: 'x' } } };
  const merged = mergeMcpConfig(existing);
  assert.equal(merged.mcpServers.hypertype.command, 'npx');
  assert.deepEqual(merged.mcpServers.keep, { command: 'x' });
});

test('clientPaths resolves absolute config locations', () => {
  const p = clientPaths();
  assert.ok(p.claudeDesktop.includes('claude_desktop_config.json'));
  assert.ok(p.cursor.endsWith('mcp.json'));
  assert.ok(p.claudeSkills.includes('hypertype'));
});
