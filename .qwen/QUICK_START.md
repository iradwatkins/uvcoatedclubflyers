# Quick Start: Using BMAD with Qwen

Since you already have Qwen on your LLM, here's how to use BMAD-METHOD with it:

## Option 1: Direct Agent Access (Simplest)

Point Qwen to the BMAD agent files directly from the `.bmad/` directory:

### Key Agent Locations:

**Development Agents:**
- `.bmad/src/modules/bmm/agents/dev.md` - Development agent
- `.bmad/src/modules/bmm/agents/architect.md` - Architecture agent
- `.bmad/src/modules/bmm/agents/test.md` - Testing agent
- `.bmad/src/modules/bmm/agents/pm.md` - Project manager agent

**Workflows:**
- `.bmad/src/modules/bmm/workflows/` - All development workflows
- `.bmad/src/core/workflows/` - Core workflows

**Creative Agents:**
- `.bmad/src/modules/cis/agents/` - Creative Intelligence Suite

## Option 2: Full Qwen Integration

To get the full BMAD experience with commands, run the installer:

```bash
cd .bmad
node tools/cli/bmad-cli.js install
```

**Select:**
- Platform: **Qwen**
- Modules: BMM (development), CIS (creative), etc.

This creates TOML command files in `.qwen/commands/bmad/` that work with Qwen's command system.

## Option 3: Use the Symlink

Your `.qwen/bmad-source` symlink points directly to `.bmad/`, so you can configure Qwen to load agents from:

```
.qwen/bmad-source/src/modules/bmm/agents/
.qwen/bmad-source/src/modules/cis/agents/
```

## Agent Activation Pattern

According to BMAD docs for Qwen, agents use the `*{agent-name}` trigger:

```
*dev - Activate development agent
*architect - Activate architect agent
*pm - Activate project manager agent
```

## All Available Modules

- **BMM** - BMad Method (Software development)
- **CIS** - Creative Intelligence Suite
- **BMB** - BMad Builder (Custom agents)
- **BMGD** - Game Development
- **Core** - Base agents and workflows
