#!/usr/bin/env node
/**
 * PromptOS Policy Engine
 * Validates prompts against defined policy rules
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class PolicyEngine {
  constructor(rulesPath = null) {
    this.rulesPath = rulesPath || path.join(__dirname, 'rules.yaml');
    this.rules = null;
    this.results = [];
    this.loadRules();
  }

  loadRules() {
    try {
      const rulesContent = fs.readFileSync(this.rulesPath, 'utf8');
      this.rules = yaml.load(rulesContent);
    } catch (error) {
      throw new Error(`Failed to load rules from ${this.rulesPath}: ${error.message}`);
    }
  }

  /**
   * Estimate token count (rough approximation: 1 token ≈ 4 characters)
   */
  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }

  /**
   * Validate a single rule
   */
  validateRule(prompt, rule) {
    const errors = [];

    if (!rule.enabled) {
      return { passed: true, errors: [] };
    }

    switch (rule.id) {
      case 'no-pii':
        return this.validateNoPII(prompt, rule);
      
      case 'no-api-keys':
        return this.validateNoApiKeys(prompt, rule);
      
      case 'max-length':
        return this.validateMaxLength(prompt, rule);
      
      case 'required-fields':
        return this.validateRequiredFields(prompt, rule);
      
      case 'semver-version':
        return this.validateSemver(prompt, rule);
      
      case 'examples-recommended':
        return this.validateExamples(prompt, rule);
      
      case 'valid-category':
        return this.validateCategory(prompt, rule);
      
      default:
        return { passed: true, errors: [] };
    }
  }

  /**
   * Validate no PII in prompt
   */
  validateNoPII(prompt, rule) {
    const errors = [];
    const promptText = typeof prompt === 'string' ? prompt : JSON.stringify(prompt);

    for (const pattern of rule.patterns) {
      const regex = new RegExp(pattern, 'gi');
      const matches = promptText.match(regex);
      if (matches) {
        errors.push({
          rule: rule.id,
          message: `Potential PII detected: ${matches[0]}`,
          severity: rule.severity
        });
      }
    }

    return {
      passed: errors.length === 0,
      errors
    };
  }

  /**
   * Validate no API keys in prompt
   */
  validateNoApiKeys(prompt, rule) {
    const errors = [];
    const promptText = typeof prompt === 'string' ? prompt : JSON.stringify(prompt);

    for (const pattern of rule.patterns) {
      const regex = new RegExp(pattern, 'gi');
      const matches = promptText.match(regex);
      if (matches) {
        errors.push({
          rule: rule.id,
          message: `Potential API key detected: ${matches[0].substring(0, 10)}...`,
          severity: rule.severity
        });
      }
    }

    return {
      passed: errors.length === 0,
      errors
    };
  }

  /**
   * Validate max length
   */
  validateMaxLength(prompt, rule) {
    const errors = [];
    const promptText = typeof prompt === 'string' ? prompt : JSON.stringify(prompt);
    const tokens = this.estimateTokens(promptText);

    if (tokens > rule.max_tokens) {
      errors.push({
        rule: rule.id,
        message: `Prompt exceeds maximum length: ${tokens} tokens (max: ${rule.max_tokens})`,
        severity: rule.severity
      });
    }

    return {
      passed: errors.length === 0,
      errors
    };
  }

  /**
   * Validate required fields
   */
  validateRequiredFields(prompt, rule) {
    const errors = [];

    if (typeof prompt === 'string') {
      errors.push({
        rule: rule.id,
        message: 'Prompt must be an object, not a string',
        severity: rule.severity
      });
      return { passed: false, errors };
    }

    for (const field of rule.required_fields) {
      if (!prompt[field]) {
        errors.push({
          rule: rule.id,
          message: `Missing required field: ${field}`,
          severity: rule.severity
        });
      }
    }

    return {
      passed: errors.length === 0,
      errors
    };
  }

  /**
   * Validate semver version
   */
  validateSemver(prompt, rule) {
    const errors = [];

    if (!prompt.version) {
      return { passed: true, errors: [] }; // Handled by required-fields
    }

    const semverRegex = new RegExp(rule.version_pattern);
    if (!semverRegex.test(prompt.version)) {
      errors.push({
        rule: rule.id,
        message: `Invalid version format: ${prompt.version}. Expected semantic version (e.g., 1.0.0)`,
        severity: rule.severity
      });
    }

    return {
      passed: errors.length === 0,
      errors
    };
  }

  /**
   * Validate examples (warning only)
   */
  validateExamples(prompt, rule) {
    const errors = [];

    if (!prompt.examples || !Array.isArray(prompt.examples) || prompt.examples.length === 0) {
      errors.push({
        rule: rule.id,
        message: 'Prompt should include examples for better understanding',
        severity: rule.severity
      });
    }

    return {
      passed: errors.length === 0,
      errors
    };
  }

  /**
   * Validate category
   */
  validateCategory(prompt, rule) {
    const errors = [];

    if (prompt.category && !rule.valid_categories.includes(prompt.category)) {
      errors.push({
        rule: rule.id,
        message: `Invalid category: ${prompt.category}. Valid categories: ${rule.valid_categories.join(', ')}`,
        severity: rule.severity
      });
    }

    return {
      passed: errors.length === 0,
      errors
    };
  }

  /**
   * Validate a prompt against all rules
   */
  validate(prompt) {
    this.results = [];
    const allErrors = [];
    let hasErrors = false;
    let hasWarnings = false;

    for (const rule of this.rules.rules) {
      const result = this.validateRule(prompt, rule);
      this.results.push({
        rule: rule.id,
        name: rule.name,
        passed: result.passed,
        errors: result.errors
      });

      for (const error of result.errors) {
        allErrors.push(error);
        if (error.severity === 'error') {
          hasErrors = true;
        } else if (error.severity === 'warning') {
          hasWarnings = true;
        }
      }
    }

    return {
      passed: !hasErrors,
      hasWarnings,
      errors: allErrors,
      results: this.results
    };
  }

  /**
   * Get formatted error output
   */
  formatErrors(validationResult) {
    let output = '';
    
    if (validationResult.passed && !validationResult.hasWarnings) {
      return '✓ All validation checks passed';
    }

    if (!validationResult.passed) {
      output += '✗ Validation FAILED\n\n';
    } else if (validationResult.hasWarnings) {
      output += '⚠ Validation passed with warnings\n\n';
    }

    // Group by severity
    const errors = validationResult.errors.filter(e => e.severity === 'error');
    const warnings = validationResult.errors.filter(e => e.severity === 'warning');

    if (errors.length > 0) {
      output += 'ERRORS:\n';
      for (const error of errors) {
        output += `  [${error.rule}] ${error.message}\n`;
      }
      output += '\n';
    }

    if (warnings.length > 0) {
      output += 'WARNINGS:\n';
      for (const warning of warnings) {
        output += `  [${warning.rule}] ${warning.message}\n`;
      }
    }

    return output.trim();
  }
}

module.exports = PolicyEngine;

// CLI usage
if (require.main === module) {
  const engine = new PolicyEngine();
  const prompt = process.argv[2];
  
  if (!prompt) {
    console.error('Usage: node engine.js <prompt-file>');
    process.exit(1);
  }
  
  try {
    const content = fs.readFileSync(prompt, 'utf8');
    const promptObj = yaml.load(content);
    const result = engine.validate(promptObj);
    console.log(engine.formatErrors(result));
    process.exit(result.passed ? 0 : 1);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}
