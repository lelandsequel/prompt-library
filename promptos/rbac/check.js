#!/usr/bin/env node
/**
 * PromptOS RBAC CLI - Check Permissions
 * Usage: node check.js <role|username> <action>
 */

const { hasPermission, checkUserPermission, VALID_ACTIONS } = require('./engine');

const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('PromptOS RBAC Permission Checker');
  console.log('=================================');
  console.log('Usage: node check.js <role|username> <action>');
  console.log('');
  console.log('Arguments:');
  console.log('  role      - Role name (admin, editor, viewer, auditor)');
  console.log('  username  - Or specify a username (alice, bob, carol)');
  console.log('  action    - Action to check (read, create, update, delete, eval, publish)');
  console.log('');
  console.log('Valid actions:', VALID_ACTIONS.join(', '));
  console.log('');
  console.log('Examples:');
  console.log('  node check.js admin read');
  console.log('  node check.js editor create');
  console.log('  node check.js viewer delete');
  console.log('  node check.js alice eval');
  console.log('  node check.js bob publish');
  process.exit(1);
}

const target = args[0];
const action = args[1];

// Try to find as user first, then as role
let result;

const userResult = checkUserPermission(target, action);
if (userResult.reason && userResult.reason.includes('Unknown user')) {
  // Not a user, try as role
  result = hasPermission(target, action);
} else {
  result = userResult;
}

if (result.allowed) {
  console.log(`✓ ALLOWED: ${target} can ${action}`);
  process.exit(0);
} else {
  console.log(`✗ FORBIDDEN: ${result.reason}`);
  process.exit(1);
}
