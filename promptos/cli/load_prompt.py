#!/usr/bin/env python3
"""
PromptOS CLI - Load and manage prompts from the JourdanLabs Prompt Library

Usage:
    python load_prompt.py --id <prompt_id>
    python load_prompt.py --category <category_name>
    python load_prompt.py --model <model_name>
    python load_prompt.py --inject key=value key2=value2
"""

import argparse
import json
import os
import re
import sys
import yaml
from pathlib import Path
from typing import Any, Optional

# Base directory for the prompt library
BASE_DIR = Path(__file__).parent.parent
REGISTRY_PATH = BASE_DIR / "registry" / "index.yaml"
SCHEMA_PATH = BASE_DIR / "schema" / "promptspec.yaml"


def load_registry() -> dict:
    """Load the prompt registry."""
    if not REGISTRY_PATH.exists():
        raise FileNotFoundError(f"Registry not found at {REGISTRY_PATH}")
    
    with open(REGISTRY_PATH, 'r') as f:
        return yaml.safe_load(f)


def load_prompt_file(filepath: Path) -> dict:
    """Load a prompt from its YAML file."""
    if not filepath.exists():
        raise FileNotFoundError(f"Prompt file not found: {filepath}")
    
    with open(filepath, 'r') as f:
        return yaml.safe_load(f)


def load_prompt_by_id(prompt_id: str) -> Optional[dict]:
    """Load a prompt by its ID."""
    registry = load_registry()
    
    for prompt in registry.get('prompts', []):
        if prompt['id'] == prompt_id:
            prompt_path = BASE_DIR / prompt['file']
            return load_prompt_file(prompt_path)
    
    return None


def load_prompts_by_category(category: str) -> list[dict]:
    """Load all prompts in a given category."""
    registry = load_registry()
    prompts = []
    
    for prompt in registry.get('prompts', []):
        if prompt['category'] == category:
            prompt_path = BASE_DIR / prompt['file']
            try:
                prompts.append(load_prompt_file(prompt_path))
            except FileNotFoundError:
                print(f"Warning: Prompt file not found for {prompt['id']}", file=sys.stderr)
    
    return prompts


def load_prompts_by_model(model: str) -> list[dict]:
    """Load all prompts compatible with a given model."""
    registry = load_registry()
    prompts = []
    
    for prompt in registry.get('prompts', []):
        prompt_path = BASE_DIR / prompt['file']
        try:
            prompt_data = load_prompt_file(prompt_path)
            compatibility = prompt_data.get('model_compatibility', [])
            if model in compatibility or '*' in compatibility:
                prompts.append(prompt_data)
        except FileNotFoundError:
            print(f"Warning: Prompt file not found for {prompt['id']}", file=sys.stderr)
    
    return prompts


def inject_variables(prompt_template: str, variables: dict) -> str:
    """Inject variables into a prompt template.
    
    Supports {{variable}} and {{#if variable}}...{{/if}} syntax.
    """
    result = prompt_template
    
    # Handle conditional blocks {{#if variable}}...{{/if}}
    conditional_pattern = r'\{\{#if\s+(\w+)\}\}(.*?)\{\{/if\}\}'
    
    def handle_conditional(match):
        var_name = match.group(1)
        content = match.group(2)
        if var_name in variables and variables[var_name]:
            return content
        return ''
    
    result = re.sub(conditional_pattern, handle_conditional, result, flags=re.DOTALL)
    
    # Handle simple variable substitution {{variable}}
    for key, value in variables.items():
        placeholder = f'{{{{{key}}}}}'
        result = result.replace(placeholder, str(value))
    
    # Remove any remaining unfilled placeholders (optional)
    # result = re.sub(r'\{\{(\w+)\}\}', '', result)
    
    return result


def format_prompt_for_model(prompt_data: dict, model: str) -> str:
    """Format a prompt according to the specified model's conventions."""
    prompt = prompt_data.get('prompt', '')
    
    # Model-specific formatting
    if 'claude' in model.lower():
        return format_for_claude(prompt_data)
    elif 'gpt' in model.lower() or 'openai' in model.lower():
        return format_for_openai(prompt_data)
    elif 'cursor' in model.lower():
        return format_for_cursor(prompt_data)
    else:
        return prompt


def format_for_claude(prompt_data: dict) -> str:
    """Format prompt for Claude models."""
    prompt = prompt_data.get('prompt', '')
    role = prompt_data.get('role', '')
    
    formatted = f"<task>\nYou are {role}. Help with the following task.\n</task>\n\n"
    formatted += f"<context>\n{{context}}\n</context>\n\n"
    formatted += f"<task_description>\n{prompt}\n</task_description>"
    
    return formatted


def format_for_openai(prompt_data: dict) -> str:
    """Format prompt for OpenAI models."""
    prompt = prompt_data.get('prompt', '')
    role = prompt_data.get('role', '')
    
    formatted = f"You are {role}. Please help with the following task.\n\n"
    formatted += f"Context: {{context}}\n\nTask: {prompt}"
    
    return formatted


def format_for_cursor(prompt_data: dict) -> str:
    """Format prompt for Cursor."""
    prompt = prompt_data.get('prompt', '')
    
    formatted = f"# Task\n{prompt}\n\n## Context\n{{context}}"
    
    return formatted


def list_categories() -> list[str]:
    """List all available categories."""
    registry = load_registry()
    return [cat['id'] for cat in registry.get('categories', [])]


def list_prompts() -> list[dict]:
    """List all available prompts with basic info."""
    registry = load_registry()
    return [
        {
            'id': p['id'],
            'name': p['name'],
            'category': p['category'],
            'version': p['version']
        }
        for p in registry.get('prompts', [])
    ]


def main():
    parser = argparse.ArgumentParser(
        description='PromptOS CLI - Load and manage prompts'
    )
    
    parser.add_argument('--id', type=str, help='Load prompt by ID')
    parser.add_argument('--category', type=str, help='Load prompts by category')
    parser.add_argument('--model', type=str, help='Filter prompts by model compatibility')
    parser.add_argument('--inject', nargs='*', help='Variables to inject (key=value format)')
    parser.add_argument('--format', choices=['claude', 'openai', 'cursor', 'raw'], 
                        default='raw', help='Output format for model')
    parser.add_argument('--list', action='store_true', help='List all prompts')
    parser.add_argument('--list-categories', action='store_true', help='List all categories')
    parser.add_argument('--json', action='store_true', help='Output as JSON')
    
    args = parser.parse_args()
    
    try:
        # Handle list commands
        if args.list:
            prompts = list_prompts()
            if args.json:
                print(json.dumps(prompts, indent=2))
            else:
                for p in prompts:
                    print(f"{p['id']:30} {p['name']:30} [{p['category']}]")
            return
        
        if args.list_categories:
            categories = list_categories()
            if args.json:
                print(json.dumps(categories, indent=2))
            else:
                print("Available categories:")
                for cat in categories:
                    print(f"  - {cat}")
            return
        
        # Load prompts based on filters
        prompts = []
        
        if args.id:
            prompt = load_prompt_by_id(args.id)
            if prompt:
                prompts = [prompt]
            else:
                print(f"Prompt not found: {args.id}", file=sys.stderr)
                sys.exit(1)
        elif args.category:
            prompts = load_prompts_by_category(args.category)
        elif args.model:
            prompts = load_prompts_by_model(args.model)
        else:
            # Load all prompts
            registry = load_registry()
            for prompt in registry.get('prompts', []):
                prompt_path = BASE_DIR / prompt['file']
                try:
                    prompts.append(load_prompt_file(prompt_path))
                except FileNotFoundError:
                    pass
        
        if not prompts:
            print("No prompts found matching criteria", file=sys.stderr)
            sys.exit(1)
        
        # Parse injection variables
        inject_vars = {}
        if args.inject:
            for pair in args.inject:
                if '=' in pair:
                    key, value = pair.split('=', 1)
                    inject_vars[key] = value
        
        # Process and output prompts
        for prompt_data in prompts:
            # Inject variables if provided
            if inject_vars:
                prompt_data['prompt'] = inject_variables(
                    prompt_data.get('prompt', ''), 
                    inject_vars
                )
            
            # Format for model if requested
            if args.format != 'raw':
                prompt_data['prompt'] = format_prompt_for_model(prompt_data, args.format)
            
            if args.json:
                print(json.dumps(prompt_data, indent=2))
            else:
                # Print prompt details
                print(f"\n{'='*60}")
                print(f"ID: {prompt_data.get('id', 'N/A')}")
                print(f"Name: {prompt_data.get('name', 'N/A')}")
                print(f"Category: {prompt_data.get('category', 'N/A')}")
                print(f"Version: {prompt_data.get('version', 'N/A')}")
                print(f"Role: {prompt_data.get('role', 'N/A')}")
                print(f"{'='*60}")
                print("\nPrompt:")
                print(prompt_data.get('prompt', ''))
                
                # Print inputs if available
                inputs = prompt_data.get('inputs', [])
                if inputs:
                    print("\nInputs:")
                    for inp in inputs:
                        required = "required" if inp.get('required') else "optional"
                        print(f"  - {inp['name']} ({inp.get('type', 'text')}, {required})")
        
    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
