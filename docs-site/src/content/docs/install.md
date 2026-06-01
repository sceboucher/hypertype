---
title: Install
description: How to add the hypertype skill to Claude Code, Cursor, other agent CLIs, and chat tools.
---

hypertype ships as a `SKILL.md` (a cross-agent standard that Claude Code, Cursor, and other agent tools read) plus a condensed paste-block for chat tools. How you add it depends on the tool. There is no one-click button yet, the deeplinks for that don't exist across these tools, so each option below is a short, real set of steps.

## Claude Code

Install it as a plugin (version-pinned, updates with the repo):

```
/plugin marketplace add sceboucher/hypertype
/plugin install hypertype@hypertype
```

Or put the skill straight into your skills folder:

```sh
git clone https://github.com/sceboucher/hypertype
cd hypertype && npm run install:skill   # ~/.claude/skills/hypertype, registers as /hypertype
```

## VS Code (GitHub Copilot)

This is the one genuine one-click install. The button installs hypertype as a Copilot **custom-instructions file**, which Copilot applies automatically when you work on HTML, CSS, or component files.

[![Install in VS Code](https://img.shields.io/badge/VS_Code-1--click_install-0098FF?style=for-the-badge&logo=visualstudiocode&logoColor=white)](https://vscode.dev/redirect?url=vscode:chat-instructions/install?url=https://raw.githubusercontent.com/sceboucher/hypertype/main/dist/hypertype.instructions.md)

It uses VS Code's built-in `vscode:chat-instructions/install` handler (1.102+), pointed at [`dist/hypertype.instructions.md`](https://github.com/sceboucher/hypertype/blob/main/dist/hypertype.instructions.md). That file is generated from the same source as the skill, so it carries the same guidance. (This installs the instructions, not `slab.js`; for the justified-headline engine, inline `slab.js` per [Getting started](/hypertype/getting-started/).)

## Cursor

`SKILL.md` works in Cursor unchanged. Drop the skill folder into a project's `.cursor/skills/` (or your global skills directory) and reload the workspace:

```sh
git clone https://github.com/sceboucher/hypertype
mkdir -p .cursor/skills
cp -r hypertype/skill .cursor/skills/hypertype
```

Cursor loads it when the task calls for typography, the same way Claude Code does.

## Codex, Gemini CLI, and other agent CLIs

`SKILL.md` is the same open standard, so a skill built for Claude Code works elsewhere without changes. Put the `skill/` folder in whatever skills directory your tool reads (check its docs for the path), and it will pick the skill up on relevant tasks.

## ChatGPT, Claude Desktop, and other chat tools

These don't install a skill from a repository. Instead, paste the condensed instruction block into your Custom Instructions, a Project, or a Custom GPT. It's about 890 tokens and carries the same guidance as the full skill:

- [`skill/paste-block.md`](https://github.com/sceboucher/hypertype/blob/main/skill/paste-block.md)

The skill and the paste-block are generated from one source, so they never drift apart.
