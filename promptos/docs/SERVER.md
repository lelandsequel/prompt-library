# PromptOS Registry Server

A minimal HTTP server exposing the prompt registry over HTTP.

## Starting the Server

```bash
# Default port 3001
node promptos/server/server.js

# Custom port
node promptos/server/server.js --port 8080

# Via CLI
promptos server --port 3001
```

## API Endpoints

### GET /registry/index.json

Returns the full prompt registry.

```bash
curl http://localhost:3001/registry/index.json
```

### GET /prompts/:id

Returns the raw YAML for a specific prompt.

```bash
curl http://localhost:3001/prompts/codegen-v1
```

### POST /eval

Runs execute() for a prompt_id with given inputs.

```bash
curl -X POST http://localhost:3001/eval \
  -H "Content-Type: application/json" \
  -d '{
    "prompt_id": "codegen-v1",
    "inputs": { "language": "Python", "requirements": "hello world" },
    "options": { "dry_run": true }
  }'
```

Response:
```json
{
  "prompt_id": "codegen-v1",
  "dry_run": true,
  "rendered_prompt": "Generate Python code...",
  "spec": { "id": "codegen-v1", "name": "Code Generation", "version": "1.0.0" }
}
```

### POST /usage

Log a usage event to analytics.

```bash
curl -X POST http://localhost:3001/usage \
  -H "Content-Type: application/json" \
  -d '{ "prompt_id": "codegen-v1", "success": true, "latency_ms": 1200 }'
```

### GET /health

Health check.

```bash
curl http://localhost:3001/health
# → {"status":"ok","ts":"2026-02-18T07:00:00.000Z"}
```

## Notes

- No authentication required (add a middleware layer for production)
- CORS headers are set for `*` (restrict for production)
- Server uses Node.js built-in `http` module (no dependencies)
