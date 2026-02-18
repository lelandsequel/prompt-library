# PromptOS Versioning

PromptOS uses semantic versioning for prompts and follows specific rules for version bumps.

## Semantic Diff Rules

Use `promptos diff <file1.yaml> <file2.yaml>` to get a recommended bump level.

### MAJOR (breaking change)

Bump the major version when:
- **role changed** — changes the AI persona and expertise
- **outputs changed** — output format/schema changed (breaks consumers)
- **required input removed** — callers that pass this input will break
- **required input type changed** — validation will fail for callers

```bash
# Example: v1.0.0 → v2.0.0
```

### MINOR (backwards-compatible addition)

Bump the minor version when:
- **prompt text changed** — different instructions but same structure
- **instructions changed** — updated guidance
- **new examples added** — more examples for context
- **new optional inputs** — callers can optionally pass new variables

```bash
# Example: v1.0.0 → v1.1.0
```

### PATCH (metadata only)

Bump the patch version when:
- **description changed** — documentation update
- **tags changed** — categorization update
- **author changed**
- **last_updated changed**
- **version field itself changed** (without content changes)

```bash
# Example: v1.0.0 → v1.0.1
```

## Running the Diff

```bash
# Compare two versions of a prompt
node promptos/diff/promptdiff.js \
  promptos/prompts/codegen/codegen-v1.yaml \
  promptos/prompts/codegen/codegen-v2.yaml

# Output:
# Recommended bump: MINOR
# [MINOR] prompt template changed
# [MINOR] 2 new example(s) added
# [PATCH] description changed
```

## Via CLI

```bash
promptos diff file1.yaml file2.yaml
```

## Version Format

Versions must follow semantic versioning: `MAJOR.MINOR.PATCH`

Examples: `1.0.0`, `2.1.3`, `0.1.0-beta`

The policy engine enforces this with the `semver-version` rule.

## Naming Convention

Prompt files should include the version in the filename:
- `codegen-v1.yaml` — major version 1
- `codegen-v2.yaml` — major version 2

The `version` field inside the YAML carries the full semver: `"1.2.3"`
