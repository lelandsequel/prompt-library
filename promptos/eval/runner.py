#!/usr/bin/env python3
"""
PromptOS Evaluation Runner

Runs evaluation test cases against prompts to measure quality and consistency.
"""

import json
import sys
import yaml
from pathlib import Path
from typing import Any, Callable, Optional
import re

# Base directory
BASE_DIR = Path(__file__).parent.parent
PROMPTS_DIR = BASE_DIR / "prompts"


class EvalResult:
    """Result of an evaluation run."""
    
    def __init__(self, prompt_id: str, test_name: str):
        self.prompt_id = prompt_id
        self.test_name = test_name
        self.passed = False
        self.score = 0.0
        self.feedback = ""
        self.details = {}
    
    def to_dict(self) -> dict:
        return {
            "prompt_id": self.prompt_id,
            "test_name": self.test_name,
            "passed": self.passed,
            "score": self.score,
            "feedback": self.feedback,
            "details": self.details
        }


class EvalRunner:
    """Runs evaluations against prompts."""
    
    def __init__(self, prompts_dir: Path = None):
        self.prompts_dir = prompts_dir or PROMPTS_DIR
        self.results = []
    
    def load_prompt(self, prompt_id: str) -> Optional[dict]:
        """Load a prompt by ID."""
        # Search all prompt files
        for yaml_file in self.prompts_dir.rglob("*.yaml"):
            with open(yaml_file, 'r') as f:
                prompt = yaml.safe_load(f)
                if prompt.get('id') == prompt_id:
                    return prompt
        return None
    
    def run_test_case(self, prompt: dict, test_case: dict) -> EvalResult:
        """Run a single test case against a prompt."""
        result = EvalResult(
            prompt.get('id', 'unknown'),
            test_case.get('name', 'unnamed test')
        )
        
        # Get the prompt template
        prompt_template = prompt.get('prompt', '')
        
        # Inject test inputs
        inputs = test_case.get('inputs', {})
        for key, value in inputs.items():
            prompt_template = prompt_template.replace(f'{{{{{key}}}}}', str(value))
        
        # Remove remaining template variables for comparison
        prompt_template = re.sub(r'\{\{[^}]+\}\}', '', prompt_template)
        
        expected = test_case.get('expected', '')
        
        # Simple string matching (can be extended with LLM-based evaluation)
        if expected.lower() in prompt_template.lower():
            result.passed = True
            result.score = 1.0
            result.feedback = "Test passed - expected content found"
        else:
            result.score = 0.0
            result.feedback = f"Expected content not found in prompt"
        
        result.details = {
            "prompt_length": len(prompt_template),
            "expected_length": len(expected)
        }
        
        return result
    
    def run_eval(self, prompt_id: str = None) -> list[EvalResult]:
        """Run all evaluations for a prompt or all prompts."""
        self.results = []
        
        if prompt_id:
            prompt = self.load_prompt(prompt_id)
            if not prompt:
                print(f"Prompt not found: {prompt_id}")
                return []
            
            test_cases = prompt.get('eval', {}).get('test_cases', [])
            for test_case in test_cases:
                result = self.run_test_case(prompt, test_case)
                self.results.append(result)
        else:
            # Run all prompts
            for yaml_file in self.prompts_dir.rglob("*.yaml"):
                with open(yaml_file, 'r') as f:
                    prompt = yaml.safe_load(f)
                    test_cases = prompt.get('eval', {}).get('test_cases', [])
                    for test_case in test_cases:
                        result = self.run_test_case(prompt, test_case)
                        self.results.append(result)
        
        return self.results
    
    def generate_report(self) -> dict:
        """Generate an evaluation report."""
        total = len(self.results)
        passed = sum(1 for r in self.results if r.passed)
        
        return {
            "total_tests": total,
            "passed": passed,
            "failed": total - passed,
            "pass_rate": passed / total if total > 0 else 0,
            "results": [r.to_dict() for r in self.results]
        }
    
    def print_report(self):
        """Print a human-readable report."""
        report = self.generate_report()
        
        print("\n" + "=" * 60)
        print("PromptOS Evaluation Report")
        print("=" * 60)
        print(f"Total Tests: {report['total_tests']}")
        print(f"Passed: {report['passed']}")
        print(f"Failed: {report['failed']}")
        print(f"Pass Rate: {report['pass_rate']:.1%}")
        print("=" * 60)
        
        for result in report['results']:
            status = "✓ PASS" if result['passed'] else "✗ FAIL"
            print(f"\n{status} - {result['prompt_id']} / {result['test_name']}")
            print(f"  Score: {result['score']:.1f}")
            print(f"  Feedback: {result['feedback']}")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Run prompt evaluations')
    parser.add_argument('--prompt-id', type=str, help='Specific prompt ID to test')
    parser.add_argument('--json', action='store_true', help='Output as JSON')
    parser.add_argument('--output', type=str, help='Write report to file')
    
    args = parser.parse_args()
    
    runner = EvalRunner()
    runner.run_eval(args.prompt_id)
    
    if args.json:
        report = runner.generate_report()
        print(json.dumps(report, indent=2))
    else:
        runner.print_report()
    
    if args.output:
        report = runner.generate_report()
        with open(args.output, 'w') as f:
            json.dump(report, f, indent=2)
        print(f"\nReport written to {args.output}")
    
    # Exit with error if any tests failed
    failed = sum(1 for r in runner.results if not r.passed)
    sys.exit(1 if failed > 0 else 0)


if __name__ == '__main__':
    main()
