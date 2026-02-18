# PromptOS Packs

Packs are portable bundles of prompts that can be installed into any PromptOS registry.

## Pack Structure

```
my-pack/
  pack.yaml           ← manifest (required)
  prompts/
    summarize-v1.yaml
    translate-v1.yaml
```

## pack.yaml Format

```yaml
name: my-pack
version: "1.0.0"
description: "A pack of writing prompts"
author: YourName
tags: [writing, content]

prompts:
  - id: summarize-v1
    file: prompts/summarize-v1.yaml
    category: writing
  - id: translate-v1
    file: prompts/translate-v1.yaml
    category: writing
```

## Commands

### Install a Pack

```bash
node promptos/packs/manager.js install path/to/my-pack/pack.yaml
```

This will:
1. Copy prompt files to `promptos/prompts/<category>/`
2. Add entries to `registry/index.json`
3. Track installation in `.telemetry/installed-packs.json`

### Uninstall a Pack

```bash
node promptos/packs/manager.js uninstall my-pack
```

Removes all prompt files belonging to the pack and updates the registry.

### List Installed Packs

```bash
node promptos/packs/manager.js list
```

### Build / Validate a Pack

```bash
node promptos/packs/manager.js build path/to/my-pack/
```

Validates the pack structure and ensures all prompt files exist.

## Via CLI

```bash
promptos pack install path/to/pack.yaml
promptos pack uninstall my-pack
promptos pack list
promptos pack build path/to/my-pack/
```

## Creating a New Pack

1. Create a directory: `mkdir my-pack && mkdir my-pack/prompts`
2. Write `my-pack/pack.yaml` (see format above)
3. Add prompt YAML files in `my-pack/prompts/`
4. Validate: `node promptos/packs/manager.js build my-pack/`
5. Install: `node promptos/packs/manager.js install my-pack/pack.yaml`

## Example Pack

See `promptos/packs/example-pack/` for a working example with 3 prompts.
