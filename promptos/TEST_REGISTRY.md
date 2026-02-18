# PromptOS Registry & Loader Test Results

**Date:** 2026-02-17  
**Tested by:** Subagent  
**Location:** `/Users/sokpyeon/.openclaw/workspace/prompt-library/promptos/`

---

## 1. Registry Validation (index.yaml vs index.json)

### ✅ PASS: YAML and JSON registries are in sync

| Check | Result |
|-------|--------|
| registry_version match | ✅ True |
| last_updated match | ✅ True |
| Same prompt IDs | ✅ True (11 prompts) |
| Same categories | ✅ True (5 categories) |
| Prompt field values match | ✅ 0 mismatches |
| Category field values match | ✅ 0 mismatches |
| All referenced files exist | ✅ 11/11 found |
| prompt_count accuracy | ✅ All correct |

**Category counts verified:**
- codegen: 7 ✓
- debugging: 1 ✓
- docs: 1 ✓
- sre: 1 ✓
- architecture: 1 ✓

---

## 2. Loader Functionality Tests

### ✅ Load by ID

```bash
python3 load_prompt.py --id codegen-v1
```
- **Result:** ✅ Works correctly
- Returns full prompt with all metadata, inputs, outputs, and template

**Error handling:**
```bash
python3 load_prompt.py --id nonexistent-id
# Output: "Prompt not found: nonexistent-id", exit code 1
```
- ✅ Properly returns error exit code

---

### ✅ Load by Category

```bash
python3 load_prompt.py --category codegen
```
- **Result:** ✅ Works correctly
- Returns 7 prompts (codegen-v1, code-review-v1, api-design-v1, test-cases-v1, refactoring-v1, security-review-v1, performance-v1)

**Edge case:**
```bash
python3 load_prompt.py --category nonexistent
# Output: "No prompts found matching criteria", exit code 1
```
- ✅ Properly handles non-existent category

---

### ✅ Filter by Model Compatibility

```bash
python3 load_prompt.py --model gpt-4o
python3 load_prompt.py --model cursor
```
- **Result:** ✅ Works correctly

| Model | Compatible Prompts Found |
|-------|--------------------------|
| gpt-4o | 5 (codegen-v1, debugging-v1, docs-gen-v1, incident-response-v1, architecture-v1) |
| cursor | 4 (codegen-v1, debugging-v1, code-review-v1, test-cases-v1) |
| copilot | 2 (codegen-v1, code-review-v1) |

**Known Issue - BUG:**
```bash
python3 load_prompt.py --model copilot --list
```
- **Problem:** The `--list` flag overrides the `--model` filter, returning ALL prompts instead of filtered ones
- **Expected:** Only 2 prompts (codegen-v1, code-review-v1)
- **Actual:** Returns all 11 prompts

---

### ✅ Input Injection

```bash
python3 load_prompt.py --id codegen-v1 --inject language=Python requirements="factorial function"
```
- **Result:** ✅ Works correctly

**Simple variable substitution:**
- `{{language}}` → `Python` ✅
- `{{requirements}}` → `factorial function` ✅
- `{{constraints}}` → filled when provided ✅
- `{{context}}` → filled when provided ✅

**Conditional blocks:**
```bash
--inject language=TypeScript framework=React requirements="button"
```
- Output: `Generate TypeScript code using React...` ✅

```bash
--inject language=Python framework= requirements="test"
```
- Output: `Generate Python code...` (framework conditional removed) ✅

**Unfilled placeholders:** Remaining `{{variable}}` placeholders are left as-is (not removed). This is by design - allows user to see what inputs are still needed.

---

### ✅ Model Format Output

```bash
python3 load_prompt.py --id codegen-v1 --format claude
python3 load_prompt.py --id codegen-v1 --format openai
python3 load_prompt.py --id codegen-v1 --format cursor
```
- **Result:** ✅ All three formats work

**Format outputs:**
- `--format claude`: Wraps in `<task>`, `<context>`, `<task_description>` XML tags
- `--format openai`: Uses "You are {role}..." style with "Context:" and "Task:" headers
- `--format cursor`: Uses Markdown with `# Task` and `## Context` headers

---

### ✅ Additional Features

```bash
python3 load_prompt.py --list
# Output: All 11 prompts formatted as table

python3 load_prompt.py --list-categories
# Output: codegen, debugging, docs, sre, architecture

python3 load_prompt.py --id codegen-v1 --json
# Output: Valid JSON with all prompt fields
```

---

## 3. Summary

### ✅ What's Working

1. **Registry Validation:**
   - YAML and JSON are valid and synchronized
   - All 11 prompt files exist and are referenced correctly
   - Category counts are accurate

2. **Loader CLI:**
   - Load by ID works perfectly
   - Load by category works perfectly
   - Model filtering works (standalone)
   - Input injection (variables + conditionals) works perfectly
   - Model format output (claude/openai/cursor) works
   - JSON output works
   - List commands work

### ❌ Issues Found

1. **BUG: `--model` + `--list` ignores model filter**
   - When both flags are used together, `--list` takes precedence and ignores the model filter
   - Should filter by model compatibility when both flags are provided
   - Impact: Low (workaround: use `--model` alone without `--list`)

2. **Minor: Unfilled placeholders remain in output**
   - Not strictly a bug - behavior is by design
   - Could be enhanced with a `--strict` flag to fail on unfilled vars

---

## 4. Test Commands Used

```bash
# Base path
cd /Users/sokpyeon/.openclaw/workspace/prompt-library/promptos/cli

# Test list
python3 load_prompt.py --list

# Test load by ID
python3 load_prompt.py --id codegen-v1
python3 load_prompt.py --id nonexistent-id

# Test category
python3 load_prompt.py --category codegen
python3 load_prompt.py --category nonexistent

# Test model filter
python3 load_prompt.py --model gpt-4o
python3 load_prompt.py --model cursor
python3 load_prompt.py --model copilot
python3 load_prompt.py --model unknown-llm

# Test injection
python3 load_prompt.py --id codegen-v1 --inject language=Python requirements="factorial"
python3 load_prompt.py --id codegen-v1 --inject language=TypeScript framework=React requirements="button"

# Test format
python3 load_prompt.py --id codegen-v1 --format claude
python3 load_prompt.py --id codegen-v1 --format openai
python3 load_prompt.py --id codegen-v1 --format cursor

# Test JSON
python3 load_prompt.py --id codegen-v1 --json
```
