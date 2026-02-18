# PromptOS Versioning Rules

## Overview

This document defines the versioning strategy for prompts in the JourdanLabs Prompt Library (PromptOS). Following semantic versioning principles ensures predictable changes and proper dependency management.

## Version Format

Versions follow [Semantic Versioning 2.0.0](https://semver.org/): `MAJOR.MINOR.PATCH`

- **MAJOR** (X.0.0): Breaking changes to prompt behavior, inputs, or outputs
- **MINOR** (1.X.0): Backward-compatible additions (new inputs, examples)
- **PATCH** (1.0.X): Backward-compatible fixes (typos, clarifications, examples)

## Version Lifecycle

### Experimental (0.x.x)
- Initial development phase
- API may change without notice
- Not recommended for production use

### Stable (1.x.x)
- Breaking changes only in MAJOR versions
- Deprecation warnings issued 30 days before removal
- Support for previous MAJOR version for 6 months

### Deprecated (x.x.x-deprecated)
- Still functional but scheduled for removal
- Shows deprecation warning when loaded
- Migration path documented

### Retired (x.x.x-retired)
- No longer maintained
- Kept for archival purposes only

## What Constitutes Breaking Changes

### MAJOR Version Bump Required When:

1. **Input Changes**
   - Removing or renaming an input variable
   - Changing required → optional or vice versa
   - Changing input type (text → select, etc.)
   - Removing default values from required inputs

2. **Output Changes**
   - Changing output format significantly
   - Adding required output fields
   - Changing output structure

3. **Prompt Behavior Changes**
   - Significantly different response format
   - Changed role/Persona substantially
   - Different framing or context requirements

4. **Model Compatibility**
   - Removing support for a previously supported model
   - Changing model-specific formatting

### MINOR Version Bump Appropriate When:

1. Adding new optional inputs
2. Adding new examples
3. Improving prompt clarity/clarifications
4. Adding new tags or categories
5. Adding new test cases
6. Expanding model compatibility

### PATCH Version Bump Appropriate When:

1. Fixing typos or grammar
2. Clarifying instructions
3. Updating examples
4. Adding notes or usage guidelines
5. Fixing formatting issues

## Version Naming Conventions

### Prompt IDs
Format: `{category}-{name}-v{major}` (e.g., `codegen-code-review-v1`)

For versioning within a prompt:
- Store version in the `version` field
- Use version suffixes for compatibility: `>=1.0.0`, `~1.2.0`

### File Naming
```
prompts/
  codegen/
    code-review-v1.yaml      # Current stable version
    code-review-v1.0.1.yaml # Specific patch version (optional archive)
    code-review-v2.yaml      # Next major version
```

## Dependency Management

### Declaring Dependencies

```yaml
dependencies:
  - id: base-context-v1
    version: ">=1.0.0"
    reason: "Provides common context variables"
```

### Version Constraints

| Constraint | Meaning |
|------------|---------|
| `1.0.0` | Exactly version 1.0.0 |
| `>=1.0.0` | Version 1.0.0 or higher |
| `~1.2.0` | >=1.2.0 and <1.3.0 |
| `^1.0.0` | >=1.0.0 and <2.0.0 |
| `>=1.0.0 <2.0.0` | Range |

### Dependency Resolution

1. Load all dependencies first
2. Resolve version conflicts by selecting highest compatible version
3. Warn if circular dependencies detected

## Changelog

Maintain a CHANGELOG.md in each prompt directory:

```markdown
# Changelog - codegen/code-review

## v1.0.0 (2024-01-15)
### Added
- Initial stable release
- Support for Claude, GPT-4, Gemini

## v1.1.0 (2024-02-01)
### Added
- New `focus_area` input for targeted reviews

## v2.0.0 (2024-03-01)
### Breaking
- Removed deprecated `review_style` input
- Changed output format to include severity levels
```

## Migration Guide

When MAJOR version changes occur:

1. Document breaking changes in CHANGELOG
2. Create migration prompts if needed
3. Provide backward compatibility layer if possible
4. Update registry to mark old version as deprecated

## Tools

Use the CLI for version management:

```bash
# Check version of a prompt
python cli/load_prompt.py --id code-review-v1 --json | jq '.version'

# List all prompts by version
python cli/load_prompt.py --list --json | jq '.[] | {id, version}'

# Validate version compliance
python cli/validate_versions.py
```

## Best Practices

1. **Test before releasing**: Validate prompts work with target models
2. **Document changes**: Always update CHANGELOG
3. **Version control**: Commit version changes separately
4. **Release notes**: Brief notes on what changed in each release
5. **Deprecation timeline**: 30-day notice for breaking changes
