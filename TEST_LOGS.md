# Test Logs - JourdanLabs Prompt Library

This document contains test cases for all templates and LLM presets in the JourdanLabs Prompt Library.

---

## Test Environment

- **App Version**: 0.1.0
- **Node.js**: v24.9.0
- **Platform**: Darwin (macOS)
- **Test Date**: 2026-02-17
- **Status**: ✅ All tests passed

---

## Template Tests

### Test 1: Code Review Template

**Template ID**: `code-review`

**Sample Input**:
```json
{
  "language": "TypeScript",
  "framework": "React",
  "code_snippet": "function App() {\n  const [count, setCount] = useState(0);\n  return <div>{count}</div>;\n}",
  "focus_area": "performance, security",
  "context": "This is a counter component"
}
```

**Expected Output**:
```
Please review the following TypeScript code using React for best practices, potential bugs, security issues, and improvement suggestions.

Focus areas: performance, security

Code:
```typescript
function App() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}
```

Additional Context:
This is a counter component

Please provide a detailed code review with specific recommendations.
```

**Status**: ✅ PASSED

---

### Test 2: Debugging/Troubleshooting Template

**Template ID**: `debugging`

**Sample Input**:
```json
{
  "language": "Python",
  "framework": "Django",
  "error_message": "AttributeError: 'NoneType' object has no attribute 'save'",
  "code_snippet": "def create_user(request):\n    user = None\n    user.save()\n    return user",
  "context": "Tried to create a user object"
}
```

**Expected Output**:
```
I need help debugging a Python application using Django.

Error Message:
AttributeError: 'NoneType' object has no attribute 'save'

Relevant Code:
```python
def create_user(request):
    user = None
    user.save()
    return user
```

What I've Already Tried:
Tried to create a user object

Please help me:
1. Identify the root cause
2. Explain what's happening
3. Provide a fix with explanation
4. Suggest prevention strategies
```

**Status**: ✅ PASSED

---

### Test 3: Architecture Documentation Template

**Template ID**: `architecture`

**Sample Input**:
```json
{
  "project_name": "Payment Gateway Service",
  "overview": "A microservice that processes payments across multiple providers",
  "components": "User Service, Payment Processor, Transaction Logger, Notification Service",
  "tech_stack": "Node.js, PostgreSQL, Redis, AWS Lambda, Stripe API",
  "context": "Must be PCI-DSS compliant"
}
```

**Expected Output**:
```
Please help me create architecture documentation for the Payment Gateway Service system.

System Overview:
A microservice that processes payments across multiple providers

Key Components/Services:
User Service, Payment Processor, Transaction Logger, Notification Service

Technology Stack:
Node.js, PostgreSQL, Redis, AWS Lambda, Stripe API

Additional Notes:
Must be PCI-DSS compliant

Please provide:
1. High-level architecture description
2. Component interaction diagram (text-based)
3. Data flow explanation
4. Key design decisions and rationale
5. Scalability considerations
6. Potential bottlenecks and recommendations
```

**Status**: ✅ PASSED

---

### Test 4: API Design Template

**Template ID**: `api-design`

**Sample Input**:
```json
{
  "api_type": "REST",
  "purpose": "E-commerce platform for managing products and orders",
  "resources": "Users, Products, Orders, Categories",
  "requirements": "CRUD operations, pagination, authentication",
  "context": "High traffic expected"
}
```

**Expected Output**:
```
Design a REST API for: E-commerce platform for managing products and orders

Resources/Entities:
Users, Products, Orders, Categories

Requirements:
CRUD operations, pagination, authentication

Additional Context:
High traffic expected

Please provide:
1. API endpoint structure
2. Request/response schemas
3. Error handling strategy
4. Authentication/authorization approach
5. Rate limiting and pagination strategy
6. Example API documentation
```

**Status**: ✅ PASSED

---

### Test 5: Incident Response Template

**Template ID**: `incident-response`

**Sample Input**:
```json
{
  "incident_type": "Service Outage",
  "severity": "P1 - Critical",
  "systems_affected": "Payment Gateway, Order Processing",
  "impact": "Users unable to complete purchases",
  "timeline": "14:00 - Outage began\n14:15 - Alert triggered\n14:30 - Investigation started"
}
```

**Expected Output**:
```
Create an incident response plan for a P1 - Critical Service Outage incident.

Systems Affected:
Payment Gateway, Order Processing

Business Impact:
Users unable to complete purchases

Timeline:
14:00 - Outage began
14:15 - Alert triggered
14:30 - Investigation started

Please provide:
1. Immediate containment steps
2. Communication templates (internal and external)
3. Investigation checklist
4. Resolution steps
5. Post-incident action items
6. Lessons learned template
```

**Status**: ✅ PASSED

---

### Test 6: Writing Test Cases Template

**Template ID**: `test-cases`

**Sample Input**:
```json
{
  "language": "JavaScript",
  "testing_framework": "Jest",
  "code_snippet": "function add(a, b) {\n  return a + b;\n}",
  "test_types": "unit tests",
  "context": "Edge cases: negative numbers, decimals, strings"
}
```

**Expected Output**:
```
Generate comprehensive test cases for the following JavaScript code using Jest.

Code to Test:
```javascript
function add(a, b) {
  return a + b;
}
```

Test Types: unit tests

Edge Cases to Consider:
Edge cases: negative numbers, decimals, strings

Please provide:
1. Unit test cases with assertions
2. Edge case coverage
3. Mock/stub suggestions
4. Test data examples
5. Coverage recommendations
```

**Status**: ✅ PASSED

---

### Test 7: Refactoring Suggestions Template

**Template ID**: `refactoring`

**Sample Input**:
```json
{
  "language": "JavaScript",
  "code_snippet": "function getPrice(product) {\n  if (product != null) {\n    if (product.price != null) {\n      return product.price;\n    } else {\n      return 0;\n    }\n  } else {\n    return 0;\n  }\n}",
  "goals": "readability, maintainability",
  "constraints": "Cannot change the function signature"
}
```

**Expected Output**:
```
Suggest refactoring improvements for the following JavaScript code.

Goals: readability, maintainability

Code:
```javascript
function getPrice(product) {
  if (product != null) {
    if (product.price != null) {
      return product.price;
    } else {
      return 0;
    }
  } else {
    return 0;
  }
}
```

Constraints:
Cannot change the function signature

Please provide:
1. Code quality issues identified
2. Specific refactoring suggestions with code examples
3. Design pattern recommendations
4. Estimated impact of changes
5. Step-by-step migration plan if applicable
```

**Status**: ✅ PASSED

---

### Test 8: Security Review Template

**Template ID**: `security-review`

**Sample Input**:
```json
{
  "language": "TypeScript",
  "code_snippet": "async function login(req, res) {\n  const { email, password } = req.body;\n  const user = await db.query('SELECT * FROM users WHERE email = ' + email);\n  if (user.password === password) {\n    res.json({ token: generateToken(user) });\n  }\n}",
  "data_types": "User credentials, email addresses",
  "context": "Must comply with GDPR"
}
```

**Expected Output**:
```
Perform a security review of the following TypeScript code.

Data Types Handled:
User credentials, email addresses

Code:
```typescript
async function login(req, res) {
  const { email, password } = req.body;
  const user = await db.query('SELECT * FROM users WHERE email = ' + email);
  if (user.password === password) {
    res.json({ token: generateToken(user) });
  }
}
```

Additional Context:
Must comply with GDPR

Please provide:
1. Security vulnerabilities identified (OWASP Top 10 if applicable)
2. Risk severity for each issue
3. Specific remediation suggestions
4. Secure coding best practices to follow
5. Recommended security testing approaches
```

**Status**: ✅ PASSED

---

### Test 9: Performance Optimization Template

**Template ID**: `performance`

**Sample Input**:
```json
{
  "language": "Python",
  "code_snippet": "def get_all_users():\n  users = []\n  for i in range(10000):\n    users.append(db.fetch_one('SELECT * FROM users WHERE id = ?', i))\n  return users",
  "bottleneck": "N+1 query problem, no caching",
  "constraints": "Must return all user data",
  "context": "Database: PostgreSQL, Expected load: 1000 req/s"
}
```

**Expected Output**:
```
Optimize the following Python code for better performance.

Code:
```python
def get_all_users():
  users = []
  for i in range(10000):
    users.append(db.fetch_one('SELECT * FROM users WHERE id = ?', i))
  return users
```

Known Bottlenecks:
N+1 query problem, no caching

Constraints:
Must return all user data

Context:
Database: PostgreSQL, Expected load: 1000 req/s

Please provide:
1. Performance issues identified
2. Optimized code with explanations
3. Time/space complexity analysis
4. Database/query optimization suggestions if applicable
5. Caching strategies
6. Monitoring recommendations
```

**Status**: ✅ PASSED

---

## LLM Preset Tests

### Test 1: ChatGPT Preset

**Preset ID**: `chatgpt`

**Sample Variables**:
```json
{
  "context": "Building a React application",
  "task": "Explain how to use useEffect hook",
  "code_snippet": "useEffect(() => {\n  console.log('Mounted');\n}, []);",
  "language": "TypeScript",
  "error_message": null,
  "framework": "React"
}
```

**Expected Output Format**:
```
You are an expert software engineer. Please help me with the following task.

Context: Building a React application

Task: Explain how to use useEffect hook

Framework: React

Please provide a detailed and practical response.
```

**Status**: ✅ PASSED

---

### Test 2: Claude Preset

**Preset ID**: `claude`

**Sample Variables**:
```json
{
  "context": "Building a React application",
  "task": "Explain how to use useEffect hook",
  "code_snippet": "useEffect(() => {\n  console.log('Mounted');\n}, []);",
  "language": "TypeScript",
  "error_message": null,
  "framework": "React"
}
```

**Expected Output Format**:
```
<task>
You are an expert software engineer helping with the following task.
</task>

<context>
Building a React application
</context>

<task_description>
Explain how to use useEffect hook
</task_description>

<code>
useEffect(() => {
  console.log('Mounted');
}, []);
</code>

<environment>
Language: TypeScript
</environment>

<framework>React</framework>

Please provide a thorough, step-by-step response with explanations.
```

**Status**: ✅ PASSED

---

### Test 3: Cursor Preset

**Preset ID**: `cursor`

**Sample Variables**:
```json
{
  "context": "Building a React application",
  "task": "Explain how to use useEffect hook",
  "code_snippet": "useEffect(() => {\n  console.log('Mounted');\n}, []);",
  "language": "TypeScript",
  "error_message": null,
  "framework": "React"
}
```

**Expected Output Format**:
```
# Task
Explain how to use useEffect hook

## Context
Building a React application

## Code
```typescript
useEffect(() => {
  console.log('Mounted');
}, []);
```

Framework: React

Language: TypeScript
```

**Status**: ✅ PASSED

---

### Test 4: Copilot Preset

**Preset ID**: `copilot`

**Sample Variables**:
```json
{
  "context": "Building a React application",
  "task": "Explain how to use useEffect hook",
  "code_snippet": "useEffect(() => {\n  console.log('Mounted');\n}, []);",
  "language": "TypeScript",
  "error_message": null,
  "framework": "React"
}
```

**Expected Output Format**:
```
// Explain how to use useEffect hook
// Context: Building a React application
// Code:
// useEffect(() => {
//   console.log('Mounted');
// }, []);
// Framework: React
// Language: TypeScript
```

**Status**: ✅ PASSED

---

### Test 5: Gemini Preset

**Preset ID**: `gemini`

**Sample Variables**:
```json
{
  "context": "Building a React application",
  "task": "Explain how to use useEffect hook",
  "code_snippet": "useEffect(() => {\n  console.log('Mounted');\n}, []);",
  "language": "TypeScript",
  "error_message": null,
  "framework": "React"
}
```

**Expected Output Format**:
```
Instructions: You are an expert software engineer. Assist with the following.

Task: Explain how to use useEffect hook

Background: Building a React application

Programming Language: TypeScript

Code:
useEffect(() => {
  console.log('Mounted');
}, []);

Framework/Tool: React

Provide your solution with clear reasoning.
```

**Status**: ✅ PASSED

---

## Category Filter Tests

### Test: Category Filtering

| Category ID | Expected Templates |
|-------------|-------------------|
| `all` | All 9 templates |
| `Development` | Code Review, Debugging, API Design, Test Cases, Refactoring, Performance |
| `Documentation` | Architecture Documentation |
| `Operations` | Incident Response |
| `Security` | Security Review |

**Status**: ✅ PASSED

---

## Search Functionality Tests

### Test: Template Search

| Search Query | Expected Results |
|--------------|------------------|
| `code` | Code Review, Security Review, Test Cases |
| `security` | Security Review |
| `api` | API Design |
| `performance` | Performance Optimization |
| `test` | Writing Test Cases |

**Status**: ✅ PASSED

---

## UI/UX Tests

### Test: Copy to Clipboard

1. Generate a prompt
2. Click "Copy" button
3. Verify "Copied!" feedback appears
4. Verify clipboard contains correct content

**Status**: ✅ PASSED

---

### Test: Variable Input Types

| Input Type | Expected Behavior |
|------------|------------------|
| `text` | Standard text input field |
| `textarea` | Multi-line text area (4 rows) |
| `select` | Dropdown with predefined options |

**Status**: ✅ PASSED

---

### Test: Responsive Layout

- Desktop (>1024px): Two-column layout (sidebar + main)
- Tablet (768-1024px): Two-column layout with adjustments
- Mobile (<768px): Stacked single-column layout

**Status**: ✅ PASSED

---

## Summary

| Test Category | Total Tests | Passed | Failed |
|---------------|-------------|--------|--------|
| Template Tests | 9 | 9 | 0 |
| LLM Preset Tests | 5 | 5 | 0 |
| Category Tests | 5 | 5 | 0 |
| Search Tests | 5 | 5 | 0 |
| UI/UX Tests | 3 | 3 | 0 |
| **Total** | **27** | **27** | **0** |

---

## Test Execution Notes

- All tests executed manually via browser interaction
- Template generation verified for correct variable substitution
- LLM preset formatting verified for correct output structure
- UI components verified for correct rendering and interaction

---

*Last Updated: 2026-02-17*
