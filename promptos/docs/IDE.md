# PromptOS IDE Extension

## Installation

1. Open VSCode or Cursor
2. Install from VSIX: `Extensions → Install from VSIX...`
3. Select `promptos/ide/extension/promptos-1.0.0.vsix`
4. Reload the editor

## Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| `PromptOS: Insert Prompt` | `Cmd+Alt+P` / `Ctrl+Alt+P` | Browse and insert a prompt |
| `PromptOS: List All Prompts` | — | View all available prompts |
| `PromptOS: Load Prompt` | — | Load a prompt by ID into editor |
| `PromptOS: Refresh Prompts` | — | Clear cache and reload |
| `PromptOS: Run Prompt` | — | Execute prompt via execute() |

## Settings

Open Settings (`Cmd+,`) and search for "PromptOS":

| Setting | Default | Description |
|---------|---------|-------------|
| `promptos.registryPath` | `./promptos/registry/index.json` | Path to registry JSON |
| `promptos.insertMode` | `insert` | `clipboard`, `insert`, or `both` |
| `promptos.model` | `claude-sonnet-4-20250514` | Default model for execution |
| `promptos.user` | `""` | Username for RBAC |
| `promptos.role` | `""` | Role for RBAC |

## Using Insert Prompt

1. Press `Cmd+Alt+P`
2. A QuickPick list appears with all registered prompts
3. Type to filter
4. Select a prompt → inputs are collected sequentially via input boxes
5. Result is inserted at cursor position (or copied to clipboard)

## Features

- **Hover Provider**: Hover over `@prompt-id` references to see metadata
- **Completion Provider**: Type `@` to get autocomplete for prompt IDs
- **Variable Collection**: Sequential input boxes for each required input
- **Output Panel**: "PromptOS" output channel shows logs

## Rebuilding the Extension

```bash
cd promptos/ide/extension

# Compile TypeScript
npm run compile

# Repackage VSIX
npx vsce package

# Install updated VSIX
code --install-extension promptos-1.0.0.vsix
```

## Troubleshooting

- **"No prompts found"**: Check `promptos.registryPath` setting points to correct registry
- **RBAC errors**: Set `promptos.user` or `promptos.role` in settings
- **Model errors**: Set `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` environment variable
