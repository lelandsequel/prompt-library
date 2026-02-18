# PromptOS Runtime Sandbox

A Node.js CLI for testing prompts from the JourdanLabs Prompt Library.

## Installation

```bash
cd /Users/sokpyeon/.openclaw/workspace/prompt-library/promptos/runtime
npm install
```

Optionally, link the CLI globally:

```bash
npm link
```

## Configuration

Create a `.env` file in the runtime directory with your API keys:

```bash
# Anthropic (Claude)
ANTHROPIC_API_KEY=your_key_here

# OpenAI (GPT)
OPENAI_API_KEY=your_key_here
```

Or set them in your shell:

```bash
export ANTHROPIC_API_KEY=your_key_here
export OPENAI_API_KEY=your_key_here
```

## Usage

### Basic Commands

```bash
# List all available prompts
prompt-run --list

# List all categories
prompt-run --list-categories
```

### Loading Prompts

```bash
# Load a specific prompt by ID
prompt-run --id codegen-v1

# Load prompts by category
prompt-run --category codegen
```

### Injecting Variables

```bash
# Inject variables via command line
prompt-run --id codegen-v1 --inject language=Python,requirements="Hello world function"

# Use JSON via stdin
echo '{"language": "TypeScript", "requirements": "HTTP server"}' | prompt-run --id codegen-v1
```

### Output Formats

```bash
# Plain text output (default)
prompt-run --id debugging-v1 --inject language=JavaScript,error_message="TypeError",code_snippet="undefined.map()"

# JSON output
prompt-run --id codegen-v1 --json --inject language=Go,requirements="CLI tool"

# Format for specific model
prompt-run --id codegen-v1 --format claude --inject language=Rust,requirements="Async HTTP"
prompt-run --id codegen-v1 --format openai --inject language=Python,requirements="REST API"
```

### Dry Run Mode

Show the rendered prompt without calling an LLM:

```bash
prompt-run --id codegen-v1 --dry-run --inject language=Python,requirements="Factorial function"
```

### Calling LLMs

```bash
# Call Claude with rendered prompt
prompt-run --id debugging-v1 --inject language=JavaScript,error_message="TypeError",code_snippet="x.map()" --model claude-sonnet-4-20250514

# Call OpenAI with rendered prompt
prompt-run --id codegen-v1 --inject language=Python,requirements="Web scraper" --model gpt-4o

# Stream the response
prompt-run --id codegen-v1 --stream --inject language=JavaScript,requirements="React component"
```

## Command Reference

| Flag | Short | Description |
|------|-------|-------------|
| `--id <id>` | `-i` | Load prompt by ID |
| `--category <cat>` | `-c` | Load prompts by category |
| `--inject <vars>` | `-v` | Variables to inject (key=value,key2=value2) |
| `--format <fmt>` | `-f` | Output format: claude, openai, cursor, raw |
| `--output <type>` | `-o` | Output type: text, json |
| `--model <model>` | `-m` | LLM model to use |
| `--dry-run` | - | Just show rendered prompt |
| `--stream` | - | Stream LLM response |
| `--list` | `-l` | List all prompts |
| `--list-categories` | - | List all categories |
| `--json` | - | Output as JSON |
| `--help` | `-h` | Show help |

## Examples

### Example 1: Code Generation

```bash
prompt-run --id codegen-v1 \
  --inject language=TypeScript,framework=React,requirements="Button component with loading state" \
  --dry-run
```

Output:
```
============================================================
ID: codegen-v1
Name: Code Generation
Category: codegen
Role: software engineer
============================================================

Rendered Prompt:
----------------------------------------
Generate TypeScript code using React for the following requirements:

Requirements:
Button component with loading state

Please provide:
1. Clean, well-structured code
2. Brief explanation of the implementation
3. Usage instructions
----------------------------------------
```

### Example 2: Debugging

```bash
prompt-run --id debugging-v1 \
  --inject language=Python,error_message="IndexError: list index out of range",code_snippet="items = [1, 2, 3]\nprint(items[5])" \
  --dry-run
```

### Example 3: Full LLM Call

```bash
prompt-run --id codegen-v1 \
  --inject language=Python,requirements="Function to calculate fibonacci number" \
  --model claude-sonnet-4-20250514
```

## Variable Syntax

The runtime supports Handlebars-like syntax:

- **Simple variables**: `{{variable_name}}`
- **Conditionals**: `{{#if variable}}content{{/if}}`

Example from a prompt:
```
Generate {{language}} code{{#if framework}} using {{framework}}{{/if}}
```

With `--inject language=Python,framework=FastAPI`, this becomes:
```
Generate Python code using FastAPI
```

## Programmatic Usage

You can also use the runtime functions in your own Node.js code:

```javascript
import { loadPromptById, injectVariables, formatPromptForModel } from './prompt-runner.js';

const prompt = loadPromptById('codegen-v1');
const rendered = injectVariables(prompt.prompt, { language: 'Python', requirements: 'test' });
const formatted = formatPromptForModel({ ...prompt, prompt: rendered }, 'claude');
```

## License

MIT
