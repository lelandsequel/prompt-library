# PROMPT_GUIDELINES.md

# JourdanLabs Prompt Library - Governance Guidelines

## Overview

This document outlines the governance, contribution, and quality standards for the JourdanLabs Prompt Library (PromptOS).

---

## 1. Prompt Development Standards

### 1.1 Prompt Structure

All prompts MUST follow the PromptSpec schema:

```yaml
id: string          # Unique identifier
name: string        # Human-readable name
description: string # What the prompt does
category: string    # Category (codegen, debugging, docs, sre, architecture)
role: string        # LLM role to assume
version: string     # Semantic version
prompt: string      # The actual prompt template
inputs: []          # Required inputs
outputs: []         # Expected outputs
```

### 1.2 Required Fields

- `id`: Unique, kebab-case (e.g., `code-review-v1`)
- `name`: Title case, max 50 chars
- `description`: Max 200 chars, clear purpose
- `category`: Must match defined categories
- `version`: Semantic versioning (X.Y.Z)
- `prompt`: The template with `{{variable}}` placeholders

### 1.3 Recommended Fields

- `examples`: At least 2 usage examples
- `tags`: For discoverability
- `eval`: Test cases for validation
- `notes`: Internal guidance

---

## 2. Quality Standards

### 2.1 Prompt Quality Checklist

- [ ] Clear, unambiguous instructions
- [ ] Appropriate level of detail
- [ ] Proper variable naming (snake_case)
- [ ] All inputs have labels and placeholders
- [ ] At least one example provided
- [ ] Role is specific and appropriate
- [ ] Context is provided where needed

### 2.2 Anti-Patterns to Avoid

- ❌ Vague instructions ("help me with code")
- ❌ Missing input validation
- ❌ Overly complex prompts (split if > 2000 tokens)
- ❌ Assuming model knowledge without context
- ❌ Conflicting instructions

### 2.3 Model Compatibility

- Test prompts with at least 2 different models
- Document model-specific requirements
- Include formatting hints for different models

---

## 3. Contribution Process

### 3.1 Workflow

1. **Create Branch**: `feature/short-description` or `fix/issue-description`
2. **Develop**: Create prompt following schema
3. **Test**: Add eval cases, run tests
4. **Document**: Update CHANGELOG, README if needed
5. **Pull Request**: Describe changes, link issues
6. **Review**: At least 1 maintainer approval
7. **Merge**: Squash and merge

### 3.2 Commit Messages

Format: `type(scope): description`

Types:
- `feat`: New prompt
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Restructuring
- `test`: Adding tests

### 3.3 PR Requirements

- All prompts validate against schema
- Tests pass
- No breaking changes (or clearly documented)
- Updated registry index

---

## 4. Categories

### 4.1 Defined Categories

| Category | Description | Examples |
|----------|-------------|----------|
| codegen | Code generation | Code Review, API Design, Test Cases |
| debugging | Troubleshooting | Bug Analysis, Error Resolution |
| docs | Documentation | README, API Docs, Architecture Docs |
| sre | Operations | Incident Response, Post-Mortem |
| architecture | System Design | Architecture Review, Tech Selection |

### 4.2 Adding Categories

1. Update schema to include category
2. Add to registry index
3. Create directory in prompts/
4. Update this document

---

## 5. Versioning & Release

### 5.1 Release Types

| Type | When | Example |
|------|------|---------|
| Patch | Bug fixes | 1.0.1 |
| Minor | New features | 1.1.0 |
| Major | Breaking changes | 2.0.0 |

### 5.2 Deprecation Policy

- Announce deprecation 30 days in advance
- Keep old version available
- Provide migration path
- Mark as deprecated in registry

---

## 6. Security & Safety

### 6.1 Content Guidelines

- No PII in prompts or examples
- No malicious content
- No hallucinations encouraged
- Respect model limitations

### 6.2 Sensitive Data

- Never include API keys in prompts
- Use placeholder patterns for credentials
- Document data handling requirements

---

## 7. Maintenance

### 7.1 Review Cadence

- Monthly: Prompt usage review
- Quarterly: Category health check
- Annual: Full library audit

### 7.2 Archive Criteria

- No usage in 6+ months
- Replaced by better alternative
- Deprecated for 3+ months

---

## 8. Contact & Support

- **Issues**: GitHub Issues
- **Discussion**: GitHub Discussions
- **Email**: jourdanlabs@example.com

---

## Appendix: Quick Reference

### Schema Validation

```bash
# Validate a prompt
python -c "import yaml; yaml.safe_load(open('prompt.yaml'))"

# List all prompts
python cli/load_prompt.py --list
```

### Common Commands

```bash
# Load prompt by ID
python cli/load_prompt.py --id code-review-v1

# Load by category
python cli/load_prompt.py --category codegen

# Run evaluations
python eval/runner.py --prompt-id code-review-v1

# Export for model
python cli/load_prompt.py --id code-review-v1 --format claude --json
```
