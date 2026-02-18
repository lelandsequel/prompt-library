# PromptOS Policy Engine

The policy engine enforces rules on all prompt executions and at validation time.

## How It Works

All prompts run through `execute()` → `checkPolicy()` which instantiates the `PolicyEngine` from `policy/engine.js` and validates the PromptSpec against `policy/rules.yaml`.

**Flow:**
```
execute() → loadPromptSpec() → checkPolicy() → PolicyEngine.validate(spec)
                                                     ↓
                                              rules.yaml rules
                                                     ↓
                                        PASS / FAIL with error messages
```

If any rule with `severity: error` fails, execution is blocked with a `Policy violation:` error.

## Configuring rules.yaml

Location: `promptos/policy/rules.yaml`

```yaml
rules:
  - id: my-rule
    name: My Rule
    description: What this rule checks
    severity: error      # or: warning
    enabled: true
    # rule-specific fields...
```

### Built-in Rules

| ID | Description | Severity |
|----|-------------|----------|
| `no-pii` | Blocks PII patterns (email, phone, SSN, IP) | error |
| `no-api-keys` | Blocks hardcoded API keys/tokens | error |
| `max-length` | Max 8192 estimated tokens | error |
| `required-fields` | id, name, description, role, version, prompt must exist | error |
| `semver-version` | Version must match `X.Y.Z` | error |
| `examples-recommended` | Warns if no examples | warning |
| `valid-category` | Category must be in allowed list | warning |

### Adding a Custom Rule

1. Add an entry to `rules.yaml`:
```yaml
- id: my-custom-rule
  name: My Custom Rule
  description: Ensures prompts mention safety
  severity: warning
  enabled: true
  patterns:
    - "unsafe"
```

2. Add handling in `policy/engine.js` → `validateRule()` switch statement.

## Disabling Rules

Set `enabled: false` on any rule to skip it.

## Settings

```yaml
settings:
  max_prompt_length: 8192
  fail_on_error: true      # exit 1 if errors found
  fail_on_warning: false   # don't exit 1 on warnings
```
