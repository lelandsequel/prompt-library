<p align="center">
  <img src="https://img.shields.io/badge/PromptOS-Enterprise%20AI%20Control%20Plane-black?style=for-the-badge&logo=openai&logoColor=white" />
  <img src="https://img.shields.io/badge/Built%20by-JourdanLabs%20×%20C%26L%20Strategy-blueviolet?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=nextdotjs" />
  <img src="https://img.shields.io/badge/Node.js-CLI%20%2B%20Runtime-green?style=for-the-badge&logo=nodedotjs" />
  <img src="https://img.shields.io/badge/VSCode-Extension-007ACC?style=for-the-badge&logo=visualstudiocode" />
</p>

<h1 align="center">⚙️ PromptOS</h1>
<p align="center"><strong>Enterprise AI Engineering Control Plane</strong><br/>Govern, version, test, and deploy prompts like code.</p>

---

## 🧭 What is PromptOS?

PromptOS is a full-stack **AI prompt engineering platform** built by **JourdanLabs × C&L Strategy**. It treats prompts the way modern engineering treats code — with versioning, testing, access control, deployment pipelines, and observability.

Whether you're a solo developer or a team of 50 engineers, PromptOS gives you:

- 🌐 **Web App** — A beautiful UI with 3 themes, 9 prompt templates, and 5 LLM presets
- 🖥️ **CLI** — Full prompt execution, registry management, analytics, and pack tooling from the terminal
- 🧩 **IDE Extension** — Run prompts directly in VSCode or Cursor without leaving your editor
- 🏗️ **Platform** — Runtime, RBAC, Policy Engine, CI Eval, Semantic Diff, Analytics, and a Learning Loop

---

## 🚀 Quick Start

```bash
# ── Web App ────────────────────────────────────────
git clone https://github.com/lelandsequel/prompt-library
cd prompt-library
npm install
npm run dev
# → Open http://localhost:3000

# ── CLI ────────────────────────────────────────────
node promptos/cli/index.js list
node promptos/cli/index.js run python-function --dry-run

# ── IDE Extension ──────────────────────────────────
code --install-extension promptos/ide/extension/promptos-1.0.0.vsix

# ── Registry Server ────────────────────────────────
cd promptos/server && npm install && node server.js --port 3001
```

---

## 🌐 Web App (`/src/app/`)

A Next.js 15 application with three switchable visual themes, an interactive prompt builder, and real-time preview.

### 🎨 Themes

| Theme | Description |
|-------|-------------|
| **Brutalist** | Bold, high-contrast, monochrome — built for focus |
| **Minimal** | Clean, spacious, elegant — the default experience |
| **Terminal** | Dark, file-tree sidebar, hacker aesthetic |

Switch themes at any time using the toggle in the header. Your selection persists across the session.

### 📋 Prompt Templates (9 built-in)

| Template | Category | Description |
|----------|----------|-------------|
| Code Review | Engineering | Deep review for quality, bugs, and best practices |
| Debugging | Engineering | Systematic root-cause analysis |
| Architecture Design | Architecture | System design with trade-offs and diagrams |
| API Design | Engineering | REST/GraphQL API spec generation |
| Incident Response | SRE | Structured incident runbook creation |
| Test Cases | QA | Comprehensive test suite generation |
| Refactoring | Engineering | Safe, structured code improvement |
| Security Review | Security | Threat modeling and vulnerability analysis |
| Performance Optimization | Engineering | Profiling-guided performance improvements |

### 🤖 LLM Presets (5)

Each preset formats the generated prompt optimally for the target model:

| Preset | Optimized For |
|--------|---------------|
| **ChatGPT** | OpenAI GPT-4 / GPT-4o |
| **Claude** | Anthropic Claude Sonnet / Opus |
| **Cursor** | Cursor AI IDE assistant |
| **Copilot** | GitHub Copilot Chat |
| **Gemini** | Google Gemini Pro / Ultra |

### ✨ Features

- **Category filter** — Browse by Engineering, Architecture, SRE, Security, QA
- **Search** — Live search across template names and descriptions
- **Variable fill-in** — Required fields (`*`) and optional fields for richer output
- **Real-time preview** — Generated prompt updates as you fill fields
- **One-click copy** — Copy to clipboard instantly
- **Custom Prompt Optimizer** — Paste any prompt and AI-optimize it for your target LLM

---

## 🖥️ CLI (`promptos/cli/index.js`)

The PromptOS CLI is a full-featured terminal tool for managing and executing prompts.

```bash
# ── Listing & Discovery ────────────────────────────
node promptos/cli/index.js list                   # List all prompts
node promptos/cli/index.js list --tag codegen     # Filter by tag

# ── Running Prompts ────────────────────────────────
node promptos/cli/index.js run <prompt_id>        # Run with defaults
node promptos/cli/index.js run <prompt_id> \
  --model claude-sonnet \
  --user alice \
  --role engineer                                 # Run with enforcement
node promptos/cli/index.js run <prompt_id> \
  --dry-run                                       # Render only, no API call

# ── Validation ─────────────────────────────────────
node promptos/cli/index.js validate               # Validate all prompts
node promptos/cli/index.js validate <prompt_id>   # Validate one prompt

# ── Analytics ──────────────────────────────────────
node promptos/cli/index.js analytics report       # Summary report
node promptos/cli/index.js analytics export \
  --output usage.json                             # Export telemetry

# ── Packs ──────────────────────────────────────────
node promptos/cli/index.js pack list              # List installed packs
node promptos/cli/index.js pack install <pack.yaml>
node promptos/cli/index.js pack uninstall <pack-name>
node promptos/cli/index.js pack build <dir>       # Build a pack from dir

# ── Semantic Diff ──────────────────────────────────
node promptos/cli/index.js diff v1.yaml v2.yaml   # Compare prompt versions

# ── Registry Server ────────────────────────────────
node promptos/cli/index.js server --port 3001     # Start local server
```

---

## 🏗️ PromptOS Platform (`/promptos/`)

### 📚 Prompt Registry (`promptos/registry/`)

The registry is the source of truth for all prompts in your organization.

```
promptos/registry/
├── index.yaml          ← Human-readable registry index
├── index.json          ← Machine-readable registry (served by API)
```

**11 built-in prompts** as PromptSpec YAML files, organized by domain:

```
promptos/prompts/
├── architecture/
│   └── architecture-v1.yaml
├── codegen/
│   ├── api-design-v1.yaml
│   ├── code-review-v1.yaml
│   ├── codegen-v1.yaml
│   ├── performance-v1.yaml
│   ├── refactoring-v1.yaml
│   ├── security-review-v1.yaml
│   └── test-cases-v1.yaml
├── debugging/
│   └── debugging-v1.yaml
├── docs/
│   └── docs-gen-v1.yaml
└── sre/
    └── incident-response-v1.yaml
```

**PromptSpec Schema:**

```yaml
id: code-review
version: 1.0.0
role: engineer
description: "Deep code review for quality, correctness, and style"
inputs:
  schema:
    language: { type: string, required: true }
    code: { type: string, required: true }
outputs:
  schema:
    review: { type: string }
prompt: |
  You are an expert {{language}} engineer.
  Review the following code for quality, bugs, and best practices:
  {{code}}
```

---

### ⚡ Runtime (`promptos/runtime/` + `promptos/execute.js`)

Every prompt execution flows through a unified, observable pipeline:

```
execute(prompt_id, inputs, options)
        │
        ▼
  1. RBAC Check       ← Does this user/role have run_prompt permission?
        │
        ▼
  2. Policy Check     ← Is this model allowed? Does data class require approval?
        │
        ▼
  3. Redact Inputs    ← Strip PII, secrets, and flagged fields
        │
        ▼
  4. Render Template  ← Interpolate variables into prompt body
        │
        ▼
  5. Model Call       ← Route to adapter (Claude / OpenAI / Local)
        │
        ▼
  6. Validate Output  ← Check output schema compliance
        │
        ▼
  7. Log Analytics    ← Append to .telemetry/promptos-usage.jsonl
```

**Model Adapters** (`promptos/adapters/` & `promptos/runtime/adapters/`):

| Adapter | File | Target |
|---------|------|--------|
| `claude` | `claude.js` | Anthropic Claude API |
| `openai` | `openai.js` | OpenAI GPT API |
| `local` | `local.js` | Local/mock for testing |

**Dry-run mode** skips the model call and returns the rendered template — useful for testing and CI.

---

### 🧩 IDE Extension (`promptos/ide/extension/`)

Run prompts from the registry directly inside VSCode or Cursor.

#### Installation

```bash
# Option A: Install from CLI
code --install-extension promptos/ide/extension/promptos-1.0.0.vsix

# Option B: Drag and drop
# Drag promptos-1.0.0.vsix into the VSCode/Cursor Extensions panel
```

#### Usage

1. Open **Command Palette** → `Cmd+Shift+P` (Mac) / `Ctrl+Shift+P` (Windows/Linux)
2. Type `PromptOS` → Select **"PromptOS: Run Prompt…"**
3. Pick a prompt from the QuickPick registry list
4. Fill in the input fields in the prompt dialog
5. Output is **inserted into your editor** or **copied to clipboard** (or both)

#### Settings (`settings.json`)

```json
{
  "promptos.registryPath": "promptos/registry/index.json",
  "promptos.insertMode": "both",
  "promptos.model": "claude-sonnet",
  "promptos.user": "your-username",
  "promptos.role": "engineer"
}
```

| Setting | Options | Description |
|---------|---------|-------------|
| `registryPath` | path string | Path to registry index |
| `insertMode` | `clipboard` \| `insert` \| `both` | How output is delivered |
| `model` | model ID string | Default model for execution |
| `user` | string | Username for RBAC checks |
| `role` | string | Role for RBAC checks |

---

### 🔒 Policy Engine (`promptos/policy/`)

Enforce governance rules at runtime — no code changes required.

**`promptos/policy/rules.yaml`** controls:
- **Model allowlists** — restrict which models can be used per prompt category
- **Data class restrictions** — flag prompts that handle PII, financial, or confidential data
- **Approval requirements** — require human sign-off for specific prompt types
- **Redaction rules** — automatically strip sensitive fields from inputs before logging

Policy violations **block execution** and return a descriptive error. This happens at step 2 of the runtime pipeline, before any data leaves the system.

---

### 👥 RBAC (`promptos/rbac/`)

Role-based access control for every operation in PromptOS.

**Roles (`promptos/rbac/roles.yaml`):**

| Role | Permissions |
|------|-------------|
| `admin` | All permissions |
| `prompt-author` | `run_prompt`, `edit_prompt` |
| `engineer` | `run_prompt` |
| `auditor` | Read-only, analytics access |

**Permissions:**
- `run_prompt` — Execute prompts via CLI, IDE, or API
- `edit_prompt` — Create/modify PromptSpec files
- `approve_prompt` — Approve prompts for production
- `install_pack` — Install prompt packs into the registry

**Check a user's permission:**

```bash
node promptos/rbac/check.js alice run_prompt
# → ✅ alice has run_prompt (role: engineer)

node promptos/rbac/check.js bob install_pack
# → ❌ bob does not have install_pack (role: engineer)
```

Users are defined in `promptos/rbac/users.yaml`.

---

### 🔁 CI Eval (`promptos/.github/workflows/` + `promptos/eval/`)

Automated evaluation runs on every PR that touches the `promptos/` directory.

**How it works:**

1. GitHub Actions triggers on PR open/sync
2. **Diff scoping** — only evals prompts that changed in the PR (fast, cheap)
3. **Full run** — triggered if `policy/`, `rbac/`, or `runtime/` changes (anything that affects all prompts)
4. Eval runner executes each prompt in dry-run mode against test cases in `eval/codegen/cases.yaml`
5. Exit code `1` fails the PR if any eval fails

**Run locally:**

```bash
cd promptos/eval
npm install
node ci-runner.js
```

---

### 🔀 Semantic Diff (`promptos/diff/promptdiff.js`)

Before merging a prompt change, run semantic diff to determine the version bump required.

```bash
node promptos/diff/promptdiff.js v1.yaml v2.yaml
```

**Bump recommendations:**

| Change Type | Bump |
|-------------|------|
| `role` or `outputs.schema` changed | **MAJOR** |
| `instructions`, `examples`, or `prompt body` changed | **MINOR** |
| `description`, `metadata`, `tags` changed | **PATCH** |

This integrates with CI to enforce proper semantic versioning before prompts ship.

---

### 📦 Prompt Packs (`promptos/packs/`)

Package and distribute prompt collections across teams or orgs.

**Pack structure:**

```
my-pack/
├── pack.yaml               ← Manifest
└── prompts/
    ├── summarize-v1.yaml
    ├── translate-v1.yaml
    └── blog-post-v1.yaml
```

**`pack.yaml` manifest:**

```yaml
name: content-team-pack
version: 1.0.0
author: content-team
description: "Prompts for the content production workflow"
prompts:
  - prompts/summarize-v1.yaml
  - prompts/translate-v1.yaml
  - prompts/blog-post-v1.yaml
```

**Pack commands:**

```bash
node promptos/cli/index.js pack list                        # List installed
node promptos/cli/index.js pack install ./my-pack/pack.yaml # Install & merge
node promptos/cli/index.js pack uninstall content-team-pack # Remove from registry
node promptos/cli/index.js pack build ./my-pack/            # Build distributable
```

An example pack is included at `promptos/packs/example-pack/`.

---

### 🌐 Registry Server (`promptos/server/server.js`)

A minimal Express server that exposes the prompt registry as a private HTTP API — useful for teams, CI pipelines, and the IDE extension in multi-user environments.

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/registry/index.json` | Full registry index |
| `GET` | `/prompts/:id` | Serve individual prompt YAML |
| `POST` | `/eval` | Trigger an eval run |
| `POST` | `/usage` | Log a usage event |

**Start:**

```bash
cd promptos/server
npm install
node server.js --port 3001
```

Point the IDE extension at `http://localhost:3001` by setting `promptos.registryPath` to the server URL.

---

### 📊 Analytics (`promptos/analytics/`)

Every prompt execution is automatically logged to a local telemetry file.

**Log location:** `promptos/.telemetry/promptos-usage.jsonl`

**Log fields (per execution):**

| Field | Description |
|-------|-------------|
| `ts` | Timestamp (ISO 8601) |
| `prompt_id` | Which prompt was run |
| `version` | Prompt version |
| `user` | Who ran it |
| `role` | Their role |
| `model` | Which model was used |
| `channel` | CLI / IDE / API |
| `input_hash` | SHA of inputs (privacy-safe) |
| `output_hash` | SHA of output |
| `success` | Boolean |
| `latency_ms` | End-to-end execution time |

**Viewing analytics:**

```bash
# Summary report in terminal
node promptos/cli/index.js analytics report

# Export full dataset as JSON
node promptos/cli/index.js analytics export --output usage.json
```

---

### 🧠 Learning Loop (`promptos/learn/`)

The learning loop is a background analyzer that reads telemetry and eval failures to identify underperforming prompts and suggest improvements.

**How it works:**

1. Reads `promptos/.telemetry/promptos-usage.jsonl` + eval failure logs
2. Identifies prompts with **>20% failure rate**
3. Generates improvement proposals as YAML files in `promptos/learn/proposals/`
4. Proposals can be reviewed, modified, and merged as new prompt versions

**Run the analyzer:**

```bash
node promptos/learn/analyzer.js
```

Proposals are human-readable YAML diffs — the analyzer explains *why* a change is suggested and what failure pattern triggered it.

---

## 📖 Documentation

All platform documentation lives in `promptos/docs/`:

| Doc | Description |
|-----|-------------|
| [`POLICY.md`](promptos/docs/POLICY.md) | Policy engine configuration reference |
| [`RBAC.md`](promptos/docs/RBAC.md) | Role and permission system |
| [`RUNTIME.md`](promptos/docs/RUNTIME.md) | Execution pipeline deep dive |
| [`PACKS.md`](promptos/docs/PACKS.md) | Pack format and distribution |
| [`ANALYTICS.md`](promptos/docs/ANALYTICS.md) | Telemetry schema and reporting |
| [`IDE.md`](promptos/docs/IDE.md) | IDE extension setup and settings |
| [`SERVER.md`](promptos/docs/SERVER.md) | Registry server API reference |
| [`VERSIONING.md`](promptos/docs/VERSIONING.md) | Semantic versioning and diff guide |

---

## 📁 Project Structure

```
prompt-library/
│
├── src/                                # Next.js Web App
│   ├── app/
│   │   ├── page.tsx                    # Main app (all 3 themes)
│   │   ├── layout.tsx                  # Root layout
│   │   ├── globals.css                 # Theme CSS variables & styles
│   │   └── api/
│   │       └── optimize/
│   │           └── route.ts            # AI prompt optimization endpoint
│   ├── components/
│   │   └── UserGuide.tsx               # In-app help modal
│   ├── context/
│   │   └── ThemeContext.tsx            # Theme state provider
│   └── data/
│       └── templates.ts                # 9 prompt templates + LLM presets
│
└── promptos/                           # PromptOS Platform
    │
    ├── cli/
    │   ├── index.js                    # CLI entry point
    │   └── load_prompt.py              # Python prompt loader utility
    │
    ├── registry/
    │   ├── index.yaml                  # Human-readable registry
    │   └── index.json                  # Machine-readable registry
    │
    ├── prompts/                        # 11 built-in PromptSpec files
    │   ├── architecture/
    │   │   └── architecture-v1.yaml
    │   ├── codegen/
    │   │   ├── api-design-v1.yaml
    │   │   ├── code-review-v1.yaml
    │   │   ├── codegen-v1.yaml
    │   │   ├── performance-v1.yaml
    │   │   ├── refactoring-v1.yaml
    │   │   ├── security-review-v1.yaml
    │   │   └── test-cases-v1.yaml
    │   ├── debugging/
    │   │   └── debugging-v1.yaml
    │   ├── docs/
    │   │   └── docs-gen-v1.yaml
    │   └── sre/
    │       └── incident-response-v1.yaml
    │
    ├── runtime/                        # Unified execution pipeline
    │   ├── execute.js                  # Core execute() function
    │   ├── prompt-runner.js            # Runner utilities
    │   ├── adapters/
    │   │   ├── claude.js
    │   │   ├── openai.js
    │   │   └── local.js
    │   └── README.md
    │
    ├── adapters/                       # Root-level adapter aliases
    │   ├── claude.js
    │   ├── openai.js
    │   └── local.js
    │
    ├── execute.js                      # Top-level execute() re-export
    │
    ├── policy/
    │   ├── rules.yaml                  # Policy rules configuration
    │   ├── engine.js                   # Policy enforcement
    │   └── validate.js                 # Validation utilities
    │
    ├── rbac/
    │   ├── roles.yaml                  # Role definitions
    │   ├── users.yaml                  # User → role assignments
    │   ├── engine.js                   # RBAC engine
    │   └── check.js                    # CLI permission checker
    │
    ├── diff/
    │   └── promptdiff.js               # Semantic diff tool
    │
    ├── analytics/
    │   ├── logger.js                   # Telemetry logger
    │   └── report.js                   # Report generator
    │
    ├── learn/
    │   ├── analyzer.js                 # Learning loop analyzer
    │   └── proposals/                  # Generated improvement proposals
    │       └── debugging-v1-proposal.yaml
    │
    ├── packs/
    │   ├── manager.js                  # Pack install/uninstall/build
    │   ├── pack-schema.yaml            # Pack manifest schema
    │   └── example-pack/
    │       ├── pack.yaml
    │       └── prompts/
    │           ├── summarize-v1.yaml
    │           ├── translate-v1.yaml
    │           └── blog-post-v1.yaml
    │
    ├── server/
    │   ├── server.js                   # Express registry server
    │   └── package.json
    │
    ├── eval/
    │   ├── ci-runner.js                # GitHub Actions eval runner
    │   ├── runner.py                   # Python eval runner
    │   └── codegen/
    │       └── cases.yaml              # Eval test cases
    │
    ├── ide/
    │   ├── promptos.json               # IDE config
    │   └── extension/
    │       ├── src/extension.ts        # Extension source
    │       ├── out/extension.js        # Compiled extension
    │       ├── promptos-1.0.0.vsix     # Installable extension package
    │       ├── snippets/promptos.json  # Code snippets
    │       └── README.md
    │
    ├── schema/
    │   └── promptspec.yaml             # PromptSpec JSON Schema
    │
    ├── docs/                           # Platform documentation
    │   ├── ANALYTICS.md
    │   ├── IDE.md
    │   ├── PACKS.md
    │   ├── POLICY.md
    │   ├── RBAC.md
    │   ├── RUNTIME.md
    │   ├── SERVER.md
    │   └── VERSIONING.md
    │
    ├── .github/
    │   └── workflows/
    │       └── prompts.yml             # CI eval workflow
    │
    ├── .telemetry/
    │   ├── promptos-usage.jsonl        # Execution telemetry
    │   └── installed-packs.json        # Pack installation state
    │
    └── package.json
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Web App | Next.js 15, React, TypeScript, Lucide Icons |
| CLI | Node.js, js-yaml, commander |
| IDE Extension | VSCode Extension API, TypeScript |
| Runtime | Node.js, custom adapter pattern |
| Analytics | JSONL flat-file, Node.js streaming |
| CI/CD | GitHub Actions |
| Policy | YAML rules, custom enforcement engine |

---

## 🤝 Built By

<p align="center">
  <a href="https://jourdanlabs.com"><strong>JourdanLabs</strong></a>
  &nbsp;×&nbsp;
  <a href="https://cl-strategy.com"><strong>C&L Strategy</strong></a>
</p>

<p align="center">
  Enterprise AI tooling for teams that ship.
</p>
