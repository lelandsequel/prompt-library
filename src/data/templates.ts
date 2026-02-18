export interface TemplateVariable {
  name: string;
  label: string;
  placeholder: string;
  required: boolean;
  type: 'text' | 'textarea' | 'select';
  options?: string[];
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  variables: TemplateVariable[];
  prompt: string;
}

export interface LLMPreset {
  id: string;
  name: string;
  description: string;
  format: string;
}

export const llmPresets: LLMPreset[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT / OpenAI',
    description: 'Optimized for OpenAI models',
    format: `You are an expert software engineer. Please help me with the following task.

Context: {{context}}

Task: {{task}}

{{#if code_snippet}}
Code to work with:
\`\`\`{{language}}
{{code_snippet}}
\`\`\`
{{/if}}

{{#if error_message}}
Error encountered:
{{error_message}}
{{/if}}

{{#if framework}}
Framework: {{framework}}
{{/if}}

Please provide a detailed and practical response.`
  },
  {
    id: 'claude',
    name: 'Claude / Anthropic',
    description: 'Optimized for Anthropic Claude models',
    format: `<task>
You are an expert software engineer helping with the following task.
</task>

<context>
{{context}}
</context>

<task_description>
{{task}}
</task_description>

{{#if code_snippet}}
<code>
{{code_snippet}}
</code>
{{/if}}

{{#if error_message}}
<error>
{{error_message}}
</error>
{{/if}}

{{#if framework}}
<framework>{{framework}}</framework>
{{/if}}

<environment>
Language: {{language}}
</environment>

Please provide a thorough, step-by-step response with explanations.`
  },
  {
    id: 'cursor',
    name: 'Cursor',
    description: 'Optimized for Cursor AI code editor',
    format: `# Task
{{task}}

## Context
{{context}}

## Code
{{#if code_snippet}}
\`\`\`{{language}}
{{code_snippet}}
\`\`\`
{{/if}}

{{#if error_message}}
## Error
{{error_message}}
{{/if}}

{{#if framework}}
Framework: {{framework}}
{{/if}}

Language: {{language}}`
  },
  {
    id: 'copilot',
    name: 'Copilot',
    description: 'Optimized for GitHub Copilot',
    format: `// {{task}}
// Context: {{context}}
{{#if code_snippet}}
// Code:
// {{code_snippet}}
{{/if}}
{{#if error_message}}
// Error: {{error_message}}
{{/if}}
{{#if framework}}
// Framework: {{framework}}
{{/if}}
// Language: {{language}}`
  },
  {
    id: 'gemini',
    name: 'Gemini',
    description: 'Optimized for Google Gemini',
    format: `Instructions: You are an expert software engineer. Assist with the following.

Task: {{task}}

Background: {{context}}

Programming Language: {{language}}

{{#if code_snippet}}
Code:
{{code_snippet}}
{{/if}}

{{#if error_message}}
Error Details:
{{error_message}}
{{/if}}

{{#if framework}}
Framework/Tool: {{framework}}
{{/if}}

Provide your solution with clear reasoning.`
  }
];

export const templates: Template[] = [
  {
    id: 'code-review',
    name: 'Code Review',
    description: 'Get a comprehensive code review with best practices and potential improvements',
    category: 'Development',
    icon: 'Eye',
    variables: [
      { name: 'language', label: 'Programming Language', placeholder: 'e.g., TypeScript, Python, Java', required: true, type: 'select', options: ['TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'Rust', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Other'] },
      { name: 'framework', label: 'Framework (optional)', placeholder: 'e.g., React, Django, Spring', required: false, type: 'text' },
      { name: 'code_snippet', label: 'Code to Review', placeholder: 'Paste your code here...', required: true, type: 'textarea' },
      { name: 'focus_area', label: 'Focus Area', placeholder: 'e.g., performance, security, readability', required: false, type: 'text' },
      { name: 'context', label: 'Additional Context', placeholder: 'Any additional context about the code...', required: false, type: 'textarea' }
    ],
    prompt: `Please review the following {{language}} code{{#if framework}} using {{framework}}{{/if}} for best practices, potential bugs, security issues, and improvement suggestions.

{{#if focus_area}}
Focus areas: {{focus_area}}
{{/if}}

Code:
\`\`\`{{language}}
{{code_snippet}}
\`\`\`

{{#if context}}
Additional Context:
{{context}}
{{/if}}

Please provide a detailed code review with specific recommendations.`
  },
  {
    id: 'debugging',
    name: 'Debugging/Troubleshooting',
    description: 'Diagnose and fix bugs with step-by-step analysis',
    category: 'Development',
    icon: 'Bug',
    variables: [
      { name: 'language', label: 'Programming Language', placeholder: 'e.g., TypeScript, Python, Java', required: true, type: 'select', options: ['TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'Rust', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Other'] },
      { name: 'framework', label: 'Framework (optional)', placeholder: 'e.g., Express, Flask, Spring', required: false, type: 'text' },
      { name: 'error_message', label: 'Error Message', placeholder: 'Paste the error message here...', required: true, type: 'textarea' },
      { name: 'code_snippet', label: 'Relevant Code', placeholder: 'Paste the relevant code section...', required: true, type: 'textarea' },
      { name: 'context', label: 'What You Tried', placeholder: 'What have you already attempted?', required: false, type: 'textarea' }
    ],
    prompt: `I need help debugging a {{language}} application{{#if framework}} using {{framework}}{{/if}}.

Error Message:
{{error_message}}

Relevant Code:
\`\`\`{{language}}
{{code_snippet}}
\`\`\`

{{#if context}}
What I've Already Tried:
{{context}}
{{/if}}

Please help me:
1. Identify the root cause
2. Explain what's happening
3. Provide a fix with explanation
4. Suggest prevention strategies`
  },
  {
    id: 'architecture',
    name: 'Architecture Documentation',
    description: 'Document system architecture, components, and design decisions',
    category: 'Documentation',
    icon: 'Building2',
    variables: [
      { name: 'project_name', label: 'Project/System Name', placeholder: 'e.g., Payment Gateway Service', required: true, type: 'text' },
      { name: 'overview', label: 'System Overview', placeholder: 'Brief description of what this system does...', required: true, type: 'textarea' },
      { name: 'components', label: 'Key Components', placeholder: 'List main components or services...', required: true, type: 'textarea' },
      { name: 'tech_stack', label: 'Technology Stack', placeholder: 'e.g., Node.js, PostgreSQL, Redis, AWS', required: true, type: 'textarea' },
      { name: 'context', label: 'Additional Notes', placeholder: 'Any additional architectural considerations...', required: false, type: 'textarea' }
    ],
    prompt: `Please help me create architecture documentation for the {{project_name}} system.

System Overview:
{{overview}}

Key Components/Services:
{{components}}

Technology Stack:
{{tech_stack}}

{{#if context}}
Additional Notes:
{{context}}
{{/if}}

Please provide:
1. High-level architecture description
2. Component interaction diagram (text-based)
3. Data flow explanation
4. Key design decisions and rationale
5. Scalability considerations
6. Potential bottlenecks and recommendations`
  },
  {
    id: 'api-design',
    name: 'API Design',
    description: 'Design RESTful or GraphQL APIs with proper patterns',
    category: 'Development',
    icon: 'Globe',
    variables: [
      { name: 'api_type', label: 'API Type', placeholder: 'REST, GraphQL, gRPC', required: true, type: 'select', options: ['REST', 'GraphQL', 'gRPC', 'WebSocket'] },
      { name: 'purpose', label: 'API Purpose', placeholder: 'What does this API do?', required: true, type: 'text' },
      { name: 'resources', label: 'Resources/Entities', placeholder: 'e.g., Users, Orders, Products', required: true, type: 'textarea' },
      { name: 'requirements', label: 'Requirements', placeholder: 'Functional requirements...', required: true, type: 'textarea' },
      { name: 'context', label: 'Additional Context', placeholder: 'Any specific constraints or requirements...', required: false, type: 'textarea' }
    ],
    prompt: `Design a {{api_type}} API for: {{purpose}}

Resources/Entities:
{{resources}}

Requirements:
{{requirements}}

{{#if context}}
Additional Context:
{{context}}
{{/if}}

Please provide:
1. API endpoint structure
2. Request/response schemas
3. Error handling strategy
4. Authentication/authorization approach
5. Rate limiting and pagination strategy
6. Example API documentation`
  },
  {
    id: 'incident-response',
    name: 'Incident Response',
    description: 'Create incident response plans and post-mortem templates',
    category: 'Operations',
    icon: 'AlertTriangle',
    variables: [
      { name: 'incident_type', label: 'Incident Type', placeholder: 'e.g., Service Outage, Data Breach, Performance', required: true, type: 'select', options: ['Service Outage', 'Data Breach', 'Performance Issue', 'Security Incident', 'Configuration Error', 'Other'] },
      { name: 'severity', label: 'Severity Level', placeholder: 'P1, P2, P3, P4', required: true, type: 'select', options: ['P1 - Critical', 'P2 - High', 'P3 - Medium', 'P4 - Low'] },
      { name: 'systems_affected', label: 'Systems Affected', placeholder: 'List affected systems/services...', required: true, type: 'textarea' },
      { name: 'impact', label: 'Business Impact', placeholder: 'Describe the impact on users/business...', required: true, type: 'textarea' },
      { name: 'timeline', label: 'Timeline Events', placeholder: 'Key events and timestamps...', required: false, type: 'textarea' }
    ],
    prompt: `Create an incident response plan for a {{severity}} {{incident_type}} incident.

Systems Affected:
{{systems_affected}}

Business Impact:
{{impact}}

{{#if timeline}}
Timeline:
{{timeline}}
{{/if}}

Please provide:
1. Immediate containment steps
2. Communication templates (internal and external)
3. Investigation checklist
4. Resolution steps
5. Post-incident action items
6. Lessons learned template`
  },
  {
    id: 'test-cases',
    name: 'Writing Test Cases',
    description: 'Generate comprehensive test cases for your code',
    category: 'Development',
    icon: 'CheckCircle',
    variables: [
      { name: 'language', label: 'Programming Language', placeholder: 'e.g., TypeScript, Python, Java', required: true, type: 'select', options: ['TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'Rust', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Other'] },
      { name: 'testing_framework', label: 'Testing Framework', placeholder: 'e.g., Jest, pytest, JUnit', required: true, type: 'text' },
      { name: 'code_snippet', label: 'Code to Test', placeholder: 'Paste the code that needs tests...', required: true, type: 'textarea' },
      { name: 'test_types', label: 'Test Types', placeholder: 'e.g., unit, integration, e2e', required: false, type: 'text' },
      { name: 'context', label: 'Edge Cases to Consider', placeholder: 'Any specific edge cases...', required: false, type: 'textarea' }
    ],
    prompt: `Generate comprehensive test cases for the following {{language}} code using {{testing_framework}}.

Code to Test:
\`\`\`{{language}}
{{code_snippet}}
\`\`\`

{{#if test_types}}
Test Types: {{test_types}}
{{/if}}

{{#if context}}
Edge Cases to Consider:
{{context}}
{{/if}}

Please provide:
1. Unit test cases with assertions
2. Edge case coverage
3. Mock/stub suggestions
4. Test data examples
5. Coverage recommendations`
  },
  {
    id: 'refactoring',
    name: 'Refactoring Suggestions',
    description: 'Get recommendations for improving code structure and quality',
    category: 'Development',
    icon: 'Wand2',
    variables: [
      { name: 'language', label: 'Programming Language', placeholder: 'e.g., TypeScript, Python, Java', required: true, type: 'select', options: ['TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'Rust', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Other'] },
      { name: 'code_snippet', label: 'Code to Refactor', placeholder: 'Paste the code to improve...', required: true, type: 'textarea' },
      { name: 'goals', label: 'Refactoring Goals', placeholder: 'e.g., readability, performance, maintainability', required: true, type: 'text' },
      { name: 'constraints', label: 'Constraints', placeholder: 'Any constraints to consider...', required: false, type: 'textarea' }
    ],
    prompt: `Suggest refactoring improvements for the following {{language}} code.

Goals: {{goals}}

Code:
\`\`\`{{language}}
{{code_snippet}}
\`\`\`

{{#if constraints}}
Constraints:
{{constraints}}
{{/if}}

Please provide:
1. Code quality issues identified
2. Specific refactoring suggestions with code examples
3. Design pattern recommendations
4. Estimated impact of changes
5. Step-by-step migration plan if applicable`
  },
  {
    id: 'security-review',
    name: 'Security Review',
    description: 'Identify security vulnerabilities and best practices',
    category: 'Security',
    icon: 'Shield',
    variables: [
      { name: 'language', label: 'Programming Language', placeholder: 'e.g., TypeScript, Python, Java', required: true, type: 'select', options: ['TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'Rust', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Other'] },
      { name: 'code_snippet', label: 'Code to Review', placeholder: 'Paste your code here...', required: true, type: 'textarea' },
      { name: 'data_types', label: 'Data Types Handled', placeholder: 'e.g., user PII, financial data, passwords', required: true, type: 'text' },
      { name: 'context', label: 'Additional Context', placeholder: 'Any security requirements or compliance needs...', required: false, type: 'textarea' }
    ],
    prompt: `Perform a security review of the following {{language}} code.

Data Types Handled:
{{data_types}}

Code:
\`\`\`{{language}}
{{code_snippet}}
\`\`\`

{{#if context}}
Additional Context:
{{context}}
{{/if}}

Please provide:
1. Security vulnerabilities identified (OWASP Top 10 if applicable)
2. Risk severity for each issue
3. Specific remediation suggestions
4. Secure coding best practices to follow
5. Recommended security testing approaches`
  },
  {
    id: 'performance',
    name: 'Performance Optimization',
    description: 'Optimize code for better performance and scalability',
    category: 'Development',
    icon: 'Zap',
    variables: [
      { name: 'language', label: 'Programming Language', placeholder: 'e.g., TypeScript, Python, Java', required: true, type: 'select', options: ['TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'Rust', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Other'] },
      { name: 'code_snippet', label: 'Code to Optimize', placeholder: 'Paste the code to optimize...', required: true, type: 'textarea' },
      { name: 'bottleneck', label: 'Known Bottlenecks', placeholder: 'Describe any known performance issues...', required: false, type: 'textarea' },
      { name: 'constraints', label: 'Constraints', placeholder: 'e.g., must maintain API compatibility', required: false, type: 'textarea' },
      { name: 'context', label: 'Context', placeholder: 'Environment, scale expectations...', required: false, type: 'textarea' }
    ],
    prompt: `Optimize the following {{language}} code for better performance.

Code:
\`\`\`{{language}}
{{code_snippet}}
\`\`\`

{{#if bottleneck}}
Known Bottlenecks:
{{bottleneck}}
{{/if}}

{{#if constraints}}
Constraints:
{{constraints}}
{{/if}}

{{#if context}}
Context:
{{context}}
{{/if}}

Please provide:
1. Performance issues identified
2. Optimized code with explanations
3. Time/space complexity analysis
4. Database/query optimization suggestions if applicable
5. Caching strategies
6. Monitoring recommendations`
  }
];

export const categories = [
  { id: 'all', name: 'All Templates', icon: 'LayoutGrid' },
  { id: 'Development', name: 'Development', icon: 'Code' },
  { id: 'Documentation', name: 'Documentation', icon: 'FileText' },
  { id: 'Operations', name: 'Operations', icon: 'Settings' },
  { id: 'Security', name: 'Security', icon: 'Lock' }
];
