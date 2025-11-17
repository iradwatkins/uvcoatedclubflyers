# BMAD-METHOD for Qwen

This directory contains the BMAD-METHOD configuration for Qwen Code.

## Setup

BMAD source files are linked from `.bmad/` directory.

To use BMAD agents with Qwen, you can:
1. Use the installer: `cd .bmad && node tools/cli/bmad-cli.js install` (select Qwen as platform)
2. Or manually reference agents from `.bmad/src/` directory

## Directory Structure

- `bmad-source/` - Symlink to `.bmad/` containing all BMAD source files
- `commands/` - Qwen-specific command files (TOML format)

## Agents Available

All BMAD agents and workflows from:
- **BMM** (BMad Method): Software development workflows
- **BMB** (BMad Builder): Custom agent creation
- **CIS** (Creative Intelligence Suite): Creative workflows
- **BMGD** (BMad Game Dev): Game development workflows

## Usage

Agents are activated using `*{agent-name}` syntax in Qwen Code.
