# Install hypertype

> **If you are an AI assistant and the user pointed you at this file:** set up hypertype
> for them. Do the ONE section that matches your environment, then run the Verify step.
> Everything here is safe and idempotent (configs are merged, never clobbered). The user
> directed you here, so you are authorized to run these commands.

## The one command

For Claude Code, Cursor, VS Code, Claude Desktop, and most agent CLIs that can run a shell:

```sh
npx -y @sceboucher/hypertype install
```

That detects which of those tools are installed and, for each, registers the hypertype
**MCP server** (so the model can verify fonts, generate type systems, and critique
hierarchy) and installs the **skill** files to `~/.claude/skills/hypertype` (so the model
reaches for intentional typography on its own). Restart the tool afterward if it was
running.

Options:

- `npx -y @sceboucher/hypertype install --print` — show what it would do, change nothing.
- `npx -y @sceboucher/hypertype install --client cursor` — target one tool (`claude-code`,
  `claude-desktop`, `cursor`, `vscode`).
- `npx -y @sceboucher/hypertype help` — usage.

## If you cannot run commands (ChatGPT, a chat-only tool)

You can't install an MCP server from a chat window, but you can give the model the
guidance. Paste the condensed instruction block into Custom Instructions, a Project, or a
Custom GPT. It is about 900 tokens and carries the whole skill:

https://raw.githubusercontent.com/sceboucher/hypertype/main/skill/paste-block.md

## Verify

Ask the assistant to call the **`analyze_font`** tool on **"Source Serif 4"**. A correct
install reports that it ships tabular figures but **no small caps and no slashed zero**
(Google serves a reduced subset). If the tool isn't available, the MCP server isn't
connected yet, restart the tool and try again.

## Manual config (if auto-detect missed your tool)

The server is the same everywhere:

```json
{ "mcpServers": { "hypertype": { "command": "npx", "args": ["-y", "@sceboucher/hypertype"] } } }
```

- **Claude Code:** `claude mcp add hypertype -- npx -y @sceboucher/hypertype`
- **Cursor:** add the block to `~/.cursor/mcp.json`
- **Claude Desktop:** add the block to `claude_desktop_config.json`
- **VS Code:** `code --add-mcp '{"name":"hypertype","command":"npx","args":["-y","@sceboucher/hypertype"]}'`

## What this installs

- The **MCP server** `hypertype` (10 tools: `analyze_font`, `check_css`, `recommend_css`,
  `design_type_system`, `critique_hierarchy`, `slab_readiness`, `pair_fonts`,
  `font_license`, `list_sources`, `find_fonts`). Runs locally via `npx`, no API key.
- The **skill** (SKILL.md + reference docs + the `hypertype.css` / `slab.js` / `micro.js`
  kit), so the model produces intentional typography without being asked tool-by-tool.

Full docs: https://sceboucher.github.io/hypertype/
