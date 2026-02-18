# PromptOS IDE Extension

A VS Code / Cursor extension for integrating PromptOS prompt library into your IDE.

## Features

- **Prompt Autocomplete/IntelliSense**: Get suggestions for prompt IDs as you type `@`
- **Insert Prompt Command**: Search and insert prompts via the command palette (`Cmd+Alt+P`)
- **Hover Metadata**: See prompt metadata when hovering over prompt references (`@prompt-id`)
- **Variable Injection**: Quick picks to fill in prompt variables before insertion
- **List All Prompts**: Browse all available prompts in the library
- **Load Prompt**: Open a prompt file directly by ID

## Installation

1. Open VS Code / Cursor
2. Go to Extensions (`Cmd+Shift+P` → "Extensions: Install from VSIX")
3. Or copy this extension folder to `~/.cursor/extensions/` or `~/.vscode/extensions/`

## Configuration

The extension can be configured via VS Code settings:

```json
{
  "promptos.promptDirectory": "./promptos/prompts",
  "promptos.registryFile": "./promptos/registry/index.json",
  "promptos.manifestFile": "./promptos/ide/promptos.json",
  "promptos.includeVariables": true,
  "promptos.showMetadataOnHover": true
}
```

## Commands

| Command | Description | Shortcut |
|---------|-------------|----------|
| `PromptOS: Insert Prompt` | Search and insert a prompt | `Cmd+Alt+P` |
| `PromptOS: List All Prompts` | Browse all available prompts | - |
| `PromptOS: Load Prompt` | Open a prompt file by ID | - |
| `PromptOS: Refresh Prompts` | Refresh the prompt cache | - |

## Usage

### Insert a Prompt

1. Press `Cmd+Alt+P` (or `Ctrl+Alt+P` on Windows/Linux)
2. Search for a prompt by name or category
3. If the prompt has required variables, fill them in via quick picks
4. The prompt text will be inserted at your cursor

### Using Autocomplete

1. Type `@` followed by a prompt ID (e.g., `@codegen-v1`)
2. VS Code will suggest matching prompts
3. Select one to complete the reference

### Viewing Metadata

Hover over any `@prompt-id` reference to see:
- Prompt name and description
- Category and version
- Required inputs
- Tags and role

## Requirements

- VS Code 1.75.0 or later
- A workspace containing the PromptOS library at `./promptos/`

## Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Package as VSIX
npm run package
```

## License

MIT
