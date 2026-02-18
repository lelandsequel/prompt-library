# PromptOS Runtime

## execute() Function

**Location:** `promptos/runtime/execute.js`

**Signature:**
```js
const { execute } = require('./runtime/execute.js');

const result = await execute(prompt_id, inputs, options);
// options: { model, user, role, dry_run, channel }
```

## Execution Flow

```
execute(prompt_id, inputs, options)
         │
         ▼
  1. loadPromptSpec()         ← registry/index.json + prompts/*.yaml
         │
         ▼
  2. checkRbac()              ← rbac/engine.js
         │                    checks: user.role has 'eval' permission
         ▼
  3. checkPolicy()            ← policy/engine.js
         │                    validates PromptSpec against rules.yaml
         ▼
  4. redactInputs()           ← replaces /pii|secret|password/i keys with [REDACTED]
         │
         ▼
  5. renderPrompt()           ← substitutes {{variable}} in template
         │
         ▼
  6. dry_run?  YES → return rendered prompt (no model call)
         │
         ▼ NO
  7. adapters/index.js        ← routes to claude.js, openai.js, or local.js
         │
         ▼
  8. validateOutputSchema()   ← if outputs.schema defined, validates JSON output
         │
         ▼
  9. logAnalytics()           ← appends to .telemetry/promptos-usage.jsonl
         │
         ▼
  10. return result
```

## Return Value

```js
{
  prompt_id: "codegen-v1",
  dry_run: false,
  rendered_prompt: "Generate Python code for...",
  output: "```python\ndef hello():\n    pass\n```",
  model: "claude-sonnet-4-20250514",
  spec: { id, name, version }
}
```

## Model Adapters

Located in `promptos/runtime/adapters/`:

| File | Model prefix | Env var required |
|------|-------------|-----------------|
| `claude.js` | `claude-*` | `ANTHROPIC_API_KEY` |
| `openai.js` | `gpt-*`, `o1-*` | `OPENAI_API_KEY` |
| `local.js` | `local-*` | none (stub) |

`index.js` auto-routes based on model name and falls back gracefully.

## CLI Usage

```bash
# Dry run
node promptos/cli/index.js run codegen-v1 --dry-run --model claude-sonnet-4-20250514

# Full run
ANTHROPIC_API_KEY=sk-... node promptos/cli/index.js run codegen-v1 \
  --model claude-sonnet-4-20250514 \
  --user alice \
  language=Python requirements="hello world function"
```
