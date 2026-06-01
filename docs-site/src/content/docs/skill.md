---
title: Use as a Claude skill
description: The same kit ships as an Agent Skill, so AI coding tools produce editorial typography instead of system-font defaults.
---

hypertype is also an [Agent Skill](https://github.com/sceboucher/hypertype/blob/main/skill/SKILL.md). The kit you can paste by hand is packaged so Claude and other AI coding tools reach for it when you ask for a headline, a hero, an editorial layout, a data table, or anything that should "look less generic."

It works because hypertype inlines. The assistants that write a single HTML file (Claude Design, Desktop, Cowork) can't run a build or `npm install`, and a `<style>` block plus a small `<script>` is the only thing that lands in all of them. So the skill tells the model to write exactly that.

## Claude Code

```bash
git clone https://github.com/sceboucher/hypertype
cd hypertype && npm run install:skill
```

That installs the skill to `~/.claude/skills/hypertype/`, where it registers as `/hypertype`. From then on the model will apply the kit when typography matters, or you can invoke it explicitly.

## Chat surfaces (Claude Design, Desktop, Cowork)

These do not load a skill from a repository, so paste the condensed instruction block instead. Copy [`skill/paste-block.md`](https://github.com/sceboucher/hypertype/blob/main/skill/paste-block.md) (about 870 tokens) into your project or system instructions. It carries the same guidance as the full skill, and both are generated from one source so they never drift.

## What the skill teaches

The skill is more than a pointer to a library. It carries the judgment calls a person makes: pick a typeface instead of leaving the system default, build headings off a scale, switch on the OpenType features that suit the context, keep the line length readable, and use `slab.js` on display headlines. That's the difference between output that looks generated and output that looks set by hand.
