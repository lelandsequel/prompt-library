#!/usr/bin/env node
/**
 * PromptOS RBAC Engine
 * Loads roles and permissions, checks if user has permission for action
 */

const fs = require('fs');
const path = require('path');

const ROLES_PATH = path.join(__dirname, 'roles.yaml');
const USERS_PATH = path.join(__dirname, 'users.yaml');

// Valid actions
const VALID_ACTIONS = ['read', 'create', 'update', 'delete', 'eval', 'publish'];

/**
 * Simple YAML parser for our specific format
 */
function parseYAML(content) {
  const result = {};
  const lines = content.split('\n');
  
  let rootKey = null;
  let currentRole = null;
  let currentKey = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const indent = line.length - trimmed.length;
    
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    // Root level key (e.g., "roles:" or "users:")
    if (indent === 0 && trimmed.endsWith(':')) {
      rootKey = trimmed.replace(':', '');
      result[rootKey] = {};
      currentRole = null;
      currentKey = null;
      continue;
    }
    
    // Second level key (role name like "admin:")
    if (indent === 2 && trimmed.endsWith(':')) {
      currentRole = trimmed.replace(':', '');
      result[rootKey][currentRole] = { permissions: [] };
      currentKey = null;
      continue;
    }
    
    // Third level key-value (description, permissions)
    if (indent === 4 && trimmed.includes(':')) {
      const colonIndex = trimmed.indexOf(':');
      currentKey = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();
      
      if (currentKey === 'permissions') {
        result[rootKey][currentRole][currentKey] = [];
      } else if (value) {
        result[rootKey][currentRole][currentKey] = value.replace(/['"]/g, '');
      }
      continue;
    }
    
    // Fourth level - permission item (- read)
    if (indent === 6 && trimmed.startsWith('-')) {
      const perm = trimmed.substring(1).trim();
      if (perm && currentRole && result[rootKey][currentRole]) {
        result[rootKey][currentRole].permissions.push(perm);
      }
      continue;
    }
    
    // Actions section (simple key: value)
    if (rootKey === 'actions' && indent === 0 && trimmed.includes(':')) {
      const colonIndex = trimmed.indexOf(':');
      const key = trimmed.substring(0, colonIndex).trim();
      const value = trimmed.substring(colonIndex + 1).trim();
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Load roles from YAML
 */
function loadRoles() {
  const content = fs.readFileSync(ROLES_PATH, 'utf8');
  const data = parseYAML(content);
  return data.roles || {};
}

/**
 * Load users from YAML
 */
function loadUsers() {
  const content = fs.readFileSync(USERS_PATH, 'utf8');
  // Simple users parser
  const users = [];
  const lines = content.split('\n');
  let currentUser = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    if (trimmed.startsWith('- username:')) {
      if (currentUser) users.push(currentUser);
      currentUser = { username: trimmed.replace('- username:', '').trim() };
    } else if (trimmed.startsWith('role:') && currentUser) {
      currentUser.role = trimmed.replace('role:', '').trim();
    } else if (trimmed.startsWith('email:') && currentUser) {
      currentUser.email = trimmed.replace('email:', '').trim();
    }
  }
  if (currentUser) users.push(currentUser);
  
  return users;
}

/**
 * Check if action is valid
 */
function isValidAction(action) {
  return VALID_ACTIONS.includes(action);
}

/**
 * Check if a role has permission for an action
 */
function hasPermission(roleName, action, rolesDB = null) {
  const roles = rolesDB || loadRoles();
  
  if (!roles[roleName]) {
    return { allowed: false, reason: `Unknown role: ${roleName}` };
  }
  
  if (!isValidAction(action)) {
    return { allowed: false, reason: `Invalid action: ${action}` };
  }
  
  const role = roles[roleName];
  const permissions = role.permissions || [];
  
  if (permissions.includes(action)) {
    return { allowed: true, role: roleName, action };
  }
  
  return { 
    allowed: false, 
    reason: `Role '${roleName}' does not have permission for '${action}'` 
  };
}

/**
 * Get user info
 */
function getUser(username, usersDB = null) {
  const users = usersDB || loadUsers();
  return users.find(u => u.username === username);
}

/**
 * Check user permission by username
 */
function checkUserPermission(username, action, rolesDB = null, usersDB = null) {
  const users = usersDB || loadUsers();
  const user = users.find(u => u.username === username);
  
  if (!user) {
    return { allowed: false, reason: `Unknown user: ${username}` };
  }
  
  return hasPermission(user.role, action, rolesDB);
}

// Export for use as module
module.exports = {
  loadRoles,
  loadUsers,
  hasPermission,
  checkUserPermission,
  isValidAction,
  VALID_ACTIONS
};

// CLI mode
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('PromptOS RBAC Permission Checker');
    console.log('Usage: node check.js <role|username> <action>');
    console.log('');
    console.log('Examples:');
    console.log('  node check.js admin read');
    console.log('  node check.js editor create');
    console.log('  node check.js alice eval');
    console.log('');
    console.log('Valid actions:', VALID_ACTIONS.join(', '));
    process.exit(1);
  }
  
  const target = args[0];
  const action = args[1];
  
  // Try to find as user first, then as role
  const users = loadUsers();
  const user = users.find(u => u.username === target);
  
  let result;
  if (user) {
    result = checkUserPermission(target, action);
  } else {
    result = hasPermission(target, action);
  }
  
  if (result.allowed) {
    console.log(`✓ ALLOWED: ${target} can ${action}`);
    process.exit(0);
  } else {
    console.log(`✗ FORBIDDEN: ${result.reason}`);
    process.exit(1);
  }
}
