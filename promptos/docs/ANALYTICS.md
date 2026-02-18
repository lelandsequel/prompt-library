# PromptOS Analytics

## What Gets Logged

Every call to `execute()` logs a JSONL record to `.telemetry/promptos-usage.jsonl`.

### Log Entry Schema

```json
{
  "ts": "2026-02-18T07:00:00.000Z",
  "prompt_id": "codegen-v1",
  "version": "1.0.0",
  "user": "alice",
  "role": "admin",
  "model": "claude-sonnet-4-20250514",
  "channel": "cli",
  "input_hash": "a1b2c3d4e5f6...",
  "output_hash": "f6e5d4c3b2a1...",
  "success": true,
  "latency_ms": 1842,
  "error": null
}
```

| Field | Description |
|-------|-------------|
| `ts` | ISO 8601 timestamp |
| `prompt_id` | Which prompt was run |
| `version` | Prompt version |
| `user` | Username (or "anonymous") |
| `role` | User's role |
| `model` | Model used |
| `channel` | Source: cli, api, ide, server |
| `input_hash` | SHA-256 hash of inputs (privacy-preserving) |
| `output_hash` | SHA-256 hash of output |
| `success` | Whether the run succeeded |
| `latency_ms` | End-to-end latency in milliseconds |
| `error` | Error message if failed, null otherwise |

Note: Actual input/output values are **never logged** — only hashes.

## Viewing Reports

```bash
# Summary report
node promptos/analytics/report.js

# Or via CLI
promptos analytics report
```

Output:
```
============================================================
PromptOS Analytics Report
============================================================
Total Runs:        42
Successes:         38
Failures:          4
Success Rate:      90.5%
Avg Latency:       1234ms

Top Prompts:
  codegen-v1                     15 runs
  debugging-v1                   12 runs
  ...
```

## Exporting Data

```bash
# Export to stdout (JSON array)
node promptos/analytics/report.js export

# Export to file
node promptos/analytics/report.js export output.json

# Or via CLI
promptos analytics export --output usage.json
```

## Learning Loop

The analyzer reads telemetry and generates improvement proposals:

```bash
node promptos/learn/analyzer.js
```

Prompts with >20% failure rate get a proposal written to `promptos/learn/proposals/<id>-proposal.yaml`.

## Log Location

```
promptos/.telemetry/promptos-usage.jsonl
```

This file is auto-created on first run. You can safely delete it to reset analytics.
