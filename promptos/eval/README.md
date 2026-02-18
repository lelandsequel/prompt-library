# Eval Case Structure

## Overview

This document defines the structure for evaluation test cases in PromptOS. Each prompt can define test cases to validate its behavior.

## Test Case Format

```yaml
eval:
  criteria:
    - name: string           # Criterion name
      description: string     # What this criterion measures
      weight: number          # 0-1 weight for scoring
    
  test_cases:
    - name: string            # Test case name
      description: string     # What this test validates
      inputs:                 # Input variables
        key: value
      expected: string        # Expected output/content
      validate:               # Validation rules
        - type: string        # "contains" | "regex" | "length" | "json"
          rule: string         # The validation rule
```

## Example

```yaml
eval:
  criteria:
    - name: completeness
      description: "Covers all code aspects"
      weight: 0.3
    - name: actionability
      description: "Provides actionable suggestions"
      weight: 0.4
    - name: clarity
      description: "Clear and well-structured"
      weight: 0.3

  test_cases:
    - name: basic_code_review
      description: "Basic code review for Python function"
      inputs:
        language: Python
        code_snippet: |
          def add(a, b):
              return a + b
        focus_area: "best practices"
      expected: "Should mention type hints, docstring"
      validate:
        - type: contains
          rule: "type hint"
        - type: contains
          rule: "docstring"
```

## Validation Types

| Type | Description | Example |
|------|-------------|---------|
| contains | Text must contain substring | `rule: "error handling"` |
| regex | Text must match regex | `rule: "^def .*:"` |
| length | Text length constraints | `rule: "min:100"` |
| json | Output must be valid JSON | `rule: "strict"` |
| structure | Must have required fields | `rule: "fields:title,content"` |

## Running Evaluations

```bash
# Run all evaluations
python eval/runner.py

# Run specific prompt
python eval/runner.py --prompt-id code-review-v1

# JSON output
python eval/runner.py --json

# Save report
python eval/runner.py --output eval/report.json
```

## Automated Scoring

The eval framework calculates scores based on:

1. **Pass/Fail Tests**: Binary pass/fail for each test case
2. **Weighted Criteria**: Each criterion contributes to final score
3. **Aggregation**: Weighted average of all criteria

```
final_score = Σ(criterion_weight × criterion_score) / Σ(criterion_weights)
```
