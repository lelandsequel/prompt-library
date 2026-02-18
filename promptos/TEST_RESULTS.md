# PromptOS Test Results

**Date:** 2026-02-17  
**Tester:** Claude Code (subagent: test-schema-eval)  
**Scope:** Schema validation, prompt loader, eval framework

---

## Summary

| Test Area | Status | Notes |
|-----------|--------|-------|
| Schema YAML validity | ✅ PASS | Valid YAML, 20 top-level keys |
| Prompt file loading (11 files) | ⚠️ PARTIAL | 10/11 pass; `api-design-v1.yaml` had YAML syntax error (now **fixed**) |
| CLI Loader (load by ID) | ✅ PASS | All 3 tested prompts load correctly |
| CLI Loader (load by category) | ⚠️ PARTIAL | `codegen` category failed pre-fix; `debugging` and `sre` pass |
| Variable injection | ✅ PASS | `{{variable}}` and `{{#if}}...{{/if}}` both work |
| Model formatting | ✅ PASS | Claude, OpenAI, Cursor formatters all work |
| Eval runner (execution) | ✅ PASS | Runs without crash after fix |
| Eval test coverage | ⚠️ LOW | Only 1 prompt (`code-review-v1`) has test cases |
| Eval test result | ❌ FAIL | 0/1 tests pass — flawed test logic (see below) |

---

## Test 1: Schema Validation

**File:** `schema/promptspec.yaml`  
**Result:** ✅ PASS

The schema file is valid YAML. It parsed successfully with `yaml.safe_load()` and defines **20 top-level keys**:

```
id, name, description, category, role, model_compatibility, version, author,
last_updated, tags, inputs, outputs, prompt, examples, eval, notes, usage,
contexts, instructions, dependencies
```

**Observation:** The schema is a documentation/reference file (not a machine-enforceable JSON Schema). There is no automated schema enforcement against prompt files. Prompts are trusted to follow the structure manually.

---

## Test 2: Loading Prompts from `/prompts/`

### All 11 prompt files scanned:

| File | Status | ID |
|------|--------|----|
| `architecture/architecture-v1.yaml` | ✅ | `architecture-v1` |
| `codegen/api-design-v1.yaml` | ❌ → ✅ fixed | `api-design-v1` |
| `codegen/code-review-v1.yaml` | ✅ | `code-review-v1` |
| `codegen/codegen-v1.yaml` | ✅ | `codegen-v1` |
| `codegen/performance-v1.yaml` | ✅ | `performance-v1` |
| `codegen/refactoring-v1.yaml` | ✅ | `refactoring-v1` |
| `codegen/security-review-v1.yaml` | ✅ | `security-review-v1` |
| `codegen/test-cases-v1.yaml` | ✅ | `test-cases-v1` |
| `debugging/debugging-v1.yaml` | ✅ | `debugging-v1` |
| `docs/docs-gen-v1.yaml` | ✅ | `docs-gen-v1` |
| `sre/incident-response-v1.yaml` | ✅ | `incident-response-v1` |

### Bug Found & Fixed: `api-design-v1.yaml` (line 111)

**Original (broken):**
```yaml
usage: Use when designing new APIs or improvings:
  - existing ones.

context API design
  - Architecture planning
  - API documentation
```

**Fixed:**
```yaml
usage: Use when designing new APIs or improving existing ones.

contexts:
  - API design
  - Architecture planning
  - API documentation
```

Two bugs in one block:
1. `usage:` value had a `:` making YAML treat it as a mapping key
2. `context` was not a valid key and had no `:`, causing a parse failure

### CLI Loader Tests (3 prompts by ID):

```
load_prompt_by_id("code-review-v1")      ✅  name=Code Review, category=codegen
load_prompt_by_id("debugging-v1")         ✅  name=Debugging/Troubleshooting, category=debugging
load_prompt_by_id("incident-response-v1") ✅  name=Incident Response, category=sre
```

### Category Loading:

```
load_prompts_by_category("codegen")    ❌ (pre-fix) → ✅ (post-fix)
load_prompts_by_category("debugging")  ✅  1 prompt
load_prompts_by_category("sre")        ✅  1 prompt
```

### Variable Injection:

The `inject_variables()` function correctly handles:
- `{{variable}}` substitution — ✅
- `{{#if variable}}...{{/if}}` conditional blocks — ✅
- Unfilled variables left in place (not silently removed) — ✅

### Model Formatting:

All three formatters produce valid output:
- `format_for_claude()` — ✅ (wraps in `<task>`, `<context>`, `<task_description>` tags)
- `format_for_openai()` — ✅ (plain text with role prefix)
- `format_for_cursor()` — ✅ (markdown `# Task` / `## Context` format)

---

## Test 3: Eval Framework (`eval/runner.py`)

### Execution

The runner crashed on first run due to the `api-design-v1.yaml` bug. After the fix, it runs cleanly.

```bash
python3 eval/runner.py
# Total Tests: 1 | Passed: 0 | Failed: 1 | Pass Rate: 0.0%
```

### Test Coverage Audit

Only **1 of 11 prompts** has `eval.test_cases` defined:

| Prompt | Test Cases |
|--------|-----------|
| `code-review-v1` | 1 |
| all others | 0 |

### The Failing Test — Logic Bug

The single test case (`basic_review` in `code-review-v1`) fails due to a **design flaw in the eval logic**, not a broken prompt:

```yaml
# test case definition:
inputs:
  language: Python
  code_snippet: "def hello():\n    print('hello')"
expected: type hint
```

The runner injects the inputs into the prompt template, then checks if `"type hint"` appears **in the rendered prompt string**. But `"type hint"` is what an LLM should *output* as a response — it will never appear in the prompt template itself.

**Root cause:** `runner.py` line 75 does string matching against the rendered prompt, but `expected` in the YAML test cases describes expected *LLM output*, not prompt content. These are fundamentally different things.

**Impact:** This means the current eval framework **cannot meaningfully test prompt quality** without LLM integration. The framework is scaffolded for future LLM-in-the-loop evaluation but isn't wired up yet.

### Eval Framework Feature Assessment

| Feature | Status |
|---------|--------|
| Load prompts by ID | ✅ Works |
| Inject test inputs | ✅ Works |
| Run test cases | ✅ Executes |
| Score test results | ⚠️ Logic is flawed (compares against prompt, not LLM output) |
| JSON output (`--json`) | ✅ Works |
| File output (`--output`) | ✅ Works |
| Filter by prompt ID (`--prompt-id`) | ✅ Works |
| LLM-based eval | ❌ Not implemented (no API calls) |

---

## Issues to Address

### Critical (breaks functionality)
1. ~~`api-design-v1.yaml` YAML syntax error~~ — **Fixed** ✅

### Medium (affects eval quality)
2. **Eval test logic mismatch** — `runner.py` compares `expected` against the rendered prompt template instead of actual LLM output. Either:
   - Change test case `expected` fields to match prompt keywords that will actually be in the prompt template, OR
   - Implement actual LLM-based evaluation and compare model responses

3. **Eval coverage is near-zero** — 10/11 prompts have no test cases at all. Add `eval.test_cases` entries for each prompt.

### Low (polish)
4. **Category loading error is unhandled** — `load_prompts_by_category()` raises an exception instead of logging a warning and skipping the bad file (contrast with `load_prompts_by_model()` which does handle errors gracefully).

5. **Schema is documentation-only** — No runtime schema validation enforces that prompt YAML files conform to `promptspec.yaml`. Consider adding jsonschema validation in the loader.

---

## Recommendations

1. **Fix eval test cases** — Update `expected` in `code-review-v1.yaml` to match something in the rendered prompt (e.g., `"code review"` or `"best practices"`) until LLM eval is integrated.

2. **Add test cases to all prompts** — Each prompt should have at least 1-2 test cases.

3. **Integrate LLM evaluation** — The eval README hints at this; the scaffolding exists in `runner.py` but needs an API call layer.

4. **Add schema enforcement** — Use `jsonschema` or `cerberus` to validate prompt files against `promptspec.yaml` at load time.

5. **Improve error handling in loader** — Wrap all file loads in try/except so one broken file doesn't kill category-level operations.
