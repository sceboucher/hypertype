// `npx @sceboucher/hypertype install` — wire the MCP server into whatever tools the
// machine has, idempotently, and drop the skill files. Each client is isolated so one
// failure can't abort the others. Nothing destructive: configs are merged, not clobbered.
import { homedir, platform } from 'node:os';
import { join, dirname } from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const PKG = '@sceboucher/hypertype';
const SERVER_NAME = 'hypertype';
const SERVER = { command: 'npx', args: ['-y', PKG] };
const RAW = 'https://raw.githubusercontent.com/sceboucher/hypertype/main';

// Merge { mcpServers: { hypertype: SERVER } } into existing config JSON, preserving
// every other key and server. Pure + testable.
export function mergeMcpConfig(existing, name = SERVER_NAME, server = SERVER) {
  const config = existing && typeof existing === 'object' ? existing : {};
  config.mcpServers = { ...(config.mcpServers || {}), [name]: server };
  return config;
}

function readJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function writeJsonMerged(path, log) {
  const before = readJson(path);
  const merged = mergeMcpConfig(before);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(merged, null, 2) + '\n');
  log(`  configured MCP server in ${path}${before ? ' (merged)' : ' (created)'}`);
  return true;
}

function commandExists(cmd) {
  const probe = platform() === 'win32' ? 'where' : 'which';
  return spawnSync(probe, [cmd], { shell: true, stdio: 'ignore' }).status === 0;
}

// Per-OS config locations.
export function clientPaths() {
  const home = homedir();
  const p = platform();
  const appData = process.env.APPDATA || join(home, 'AppData', 'Roaming');
  return {
    claudeDesktop:
      p === 'win32'
        ? join(appData, 'Claude', 'claude_desktop_config.json')
        : p === 'darwin'
          ? join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json')
          : join(home, '.config', 'Claude', 'claude_desktop_config.json'),
    cursor: join(home, '.cursor', 'mcp.json'),
    claudeSkills: join(home, '.claude', 'skills', 'hypertype'),
  };
}

// --- per-client installers, each returns true if it did something ---

function installClaudeCode(log) {
  if (!commandExists('claude')) return false;
  // Idempotent: remove any prior entry, then add. Tolerate a missing prior entry.
  spawnSync('claude', ['mcp', 'remove', SERVER_NAME], { shell: true, stdio: 'ignore' });
  const r = spawnSync(
    'claude',
    ['mcp', 'add', SERVER_NAME, '--', 'npx', '-y', PKG],
    { shell: true, encoding: 'utf8' },
  );
  if (r.status === 0) {
    log('  Claude Code: registered MCP server via `claude mcp add`');
    return true;
  }
  log(`  Claude Code: \`claude mcp add\` failed (${(r.stderr || '').trim().split('\n')[0] || 'unknown'})`);
  return false;
}

function installClaudeDesktop(log) {
  const path = clientPaths().claudeDesktop;
  // Only touch it if Claude Desktop is actually installed (its dir exists).
  if (!existsSync(dirname(path))) return false;
  log('  Claude Desktop:');
  return writeJsonMerged(path, log);
}

function installCursor(log) {
  const path = clientPaths().cursor;
  if (!existsSync(join(homedir(), '.cursor'))) return false;
  log('  Cursor:');
  return writeJsonMerged(path, log);
}

function installVSCode(log) {
  if (!commandExists('code')) return false;
  const r = spawnSync(
    'code',
    ['--add-mcp', JSON.stringify({ name: SERVER_NAME, ...SERVER })],
    { shell: true, encoding: 'utf8' },
  );
  if (r.status === 0) {
    log('  VS Code: registered MCP server via `code --add-mcp`');
    return true;
  }
  return false;
}

const SKILL_FILES = [
  'SKILL.md',
  'references/REFERENCE.md',
  'references/TYPE-SYSTEMS.md',
  'references/HIERARCHY.md',
  'assets/hypertype.css',
  'assets/slab.js',
  'assets/micro.js',
];

async function installSkill(destDir, log) {
  let ok = 0;
  for (const rel of SKILL_FILES) {
    try {
      const res = await fetch(`${RAW}/skill/${rel}`);
      if (!res.ok) continue;
      const dest = join(destDir, rel);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
      ok++;
    } catch {
      // skip this file
    }
  }
  if (ok) log(`  Skill: installed ${ok}/${SKILL_FILES.length} files to ${destDir}`);
  return ok > 0;
}

export async function runInstaller(argv = []) {
  const log = (m) => console.log(m);
  const flags = new Set(argv.filter((a) => a.startsWith('--')));
  const only = (() => {
    const i = argv.indexOf('--client');
    return i !== -1 ? argv[i + 1] : null;
  })();
  const dryRun = flags.has('--print');

  log(`hypertype installer — wiring ${PKG} into your tools`);
  if (dryRun) {
    log('\n[--print] Would configure the MCP server:');
    log(JSON.stringify({ mcpServers: { [SERVER_NAME]: SERVER } }, null, 2));
    log('\nTargets: Claude Code, Claude Desktop, Cursor, VS Code (whichever are present),');
    log('plus the skill files to ~/.claude/skills/hypertype.');
    return;
  }

  const clients = {
    'claude-code': installClaudeCode,
    'claude-desktop': installClaudeDesktop,
    cursor: installCursor,
    vscode: installVSCode,
  };

  log('\nMCP server:');
  let any = false;
  for (const [id, fn] of Object.entries(clients)) {
    if (only && only !== id) continue;
    try {
      if (await fn(log)) any = true;
    } catch (e) {
      log(`  ${id}: skipped (${e.message})`);
    }
  }
  if (!any) {
    log('  No supported client detected to auto-configure. Add this to your MCP config by hand:');
    log(`  ${JSON.stringify({ mcpServers: { [SERVER_NAME]: SERVER } })}`);
  }

  log('\nSkill:');
  await installSkill(clientPaths().claudeSkills, log);

  log('\nDone. Restart your tool if it was running. Verify by asking it to call the');
  log('`analyze_font` tool on "Source Serif 4" — it should report no small caps.');
}
