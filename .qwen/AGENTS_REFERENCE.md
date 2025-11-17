# BMAD-METHOD Agents Reference for Qwen

All BMAD agents are available in the `.bmad/src/modules/` directory.

## How to Use Agents

According to BMAD documentation, Qwen uses the `*{agent-name}` trigger pattern:

```
*dev          - Activate development agent
*architect    - Activate architect agent
*pm           - Activate project manager
```

## Available Agents

### 📦 BMM Module (Software Development)

**Location:** `.bmad/src/modules/bmm/agents/`

| Agent | File | Description |
|-------|------|-------------|
| `*analyst` | `analyst.agent.yaml` | Business Analyst - Requirements gathering |
| `*architect` | `architect.agent.yaml` | System Architect - Architecture design |
| `*dev` | `dev.agent.yaml` | Developer - Code implementation |
| `*frame-expert` | `frame-expert.agent.yaml` | Framework Expert - Framework guidance |
| `*pm` | `pm.agent.yaml` | Project Manager - Project planning |
| `*sm` | `sm.agent.yaml` | Scrum Master - Agile facilitation |
| `*tea` | `tea.agent.yaml` | Technical Expert Advisor |
| `*tech-writer` | `tech-writer.agent.yaml` | Technical Writer - Documentation |
| `*ux-designer` | `ux-designer.agent.yaml` | UX Designer - User experience |

### 🎮 BMGD Module (Game Development)

**Location:** `.bmad/src/modules/bmgd/agents/`

| Agent | File | Description |
|-------|------|-------------|
| `*game-architect` | `game-architect.agent.yaml` | Game System Architect |
| `*game-designer` | `game-designer.agent.yaml` | Game Designer |
| `*game-dev` | `game-dev.agent.yaml` | Game Developer |
| `*game-scrum-master` | `game-scrum-master.agent.yaml` | Game Scrum Master |

### 🎨 CIS Module (Creative Intelligence Suite)

**Location:** `.bmad/src/modules/cis/agents/`

| Agent | File | Description |
|-------|------|-------------|
| `*brainstorming-coach` | `brainstorming-coach.agent.yaml` | Brainstorming Facilitator |
| `*creative-problem-solver` | `creative-problem-solver.agent.yaml` | Creative Problem Solver |
| `*design-thinking-coach` | `design-thinking-coach.agent.yaml` | Design Thinking Coach |
| `*innovation-strategist` | `innovation-strategist.agent.yaml` | Innovation Strategist |
| `*storyteller` | `storyteller.agent.yaml` | Storyteller |

### 🛠️ BMB Module (BMad Builder)

**Location:** `.bmad/src/modules/bmb/agents/`

| Agent | File | Description |
|-------|------|-------------|
| `*bmad-builder` | `bmad-builder.agent.yaml` | Create custom agents |

## Workflows Available

### Core Workflows
- `.bmad/src/core/workflows/brainstorming/`
- `.bmad/src/core/workflows/party-mode/`

### BMM Workflows
Located in `.bmad/src/modules/bmm/workflows/`:
- `1-discovery-workflows/` - Project discovery
- `2-plan-workflows/` - Planning (PRD, Tech Spec, Epics)
- `3-design-workflows/` - Design work
- `4-implementation/` - Development
- `5-retrospective/` - Sprint retrospectives
- `frame-expert/` - Framework guidance

## Tools & Commands

### Core Tools
- `/bmad:core:tools:shard-doc` - Document sharding tool

### Workflows
- `/bmad:core:workflows:brainstorming` - Brainstorming session
- `/bmad:core:workflows:party-mode` - Party mode workflow

## Quick Reference Paths

**For direct file access in Qwen:**
- Software Dev Agents: `.bmad/src/modules/bmm/agents/*.agent.yaml`
- Game Dev Agents: `.bmad/src/modules/bmgd/agents/*.agent.yaml`
- Creative Agents: `.bmad/src/modules/cis/agents/*.agent.yaml`
- All Workflows: `.bmad/src/modules/*/workflows/`

## Usage Example

To use an agent in Qwen, reference the agent file or use the trigger pattern:

```
# Option 1: Direct reference
Load agent from: .bmad/src/modules/bmm/agents/dev.agent.yaml

# Option 2: Trigger pattern (if supported)
*dev

# Option 3: Full path reference
Use the development agent at .bmad/src/modules/bmm/agents/dev.agent.yaml
```

---

**Total Agents Available:** 19 agents across 4 modules
