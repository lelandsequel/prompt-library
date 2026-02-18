/**
 * Extension validation test script
 * Run this to verify the extension is properly structured
 */

const fs = require('fs');
const path = require('path');

function validateExtension() {
  const extDir = __dirname;
  console.log('PromptOS Extension Validation');
  console.log('==============================\n');
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: package.json exists and is valid
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(extDir, 'package.json'), 'utf-8'));
    console.log('✓ package.json is valid JSON');
    console.log(`  - Name: ${pkg.name}`);
    console.log(`  - Version: ${pkg.version}`);
    console.log(`  - Commands: ${pkg.contributes.commands.length}`);
    passed++;
  } catch (e) {
    console.log('✗ package.json is invalid:', e.message);
    failed++;
  }
  
  // Test 2: Main extension file exists
  const mainFile = path.join(extDir, 'out/extension.js');
  if (fs.existsSync(mainFile)) {
    console.log('✓ Main extension file exists');
    passed++;
  } else {
    console.log('✗ Main extension file missing');
    failed++;
  }
  
  // Test 3: Snippets exist
  const snippetsFile = path.join(extDir, 'snippets/promptos.json');
  if (fs.existsSync(snippetsFile)) {
    const snippets = JSON.parse(fs.readFileSync(snippetsFile, 'utf-8'));
    console.log(`✓ Snippets file exists (${Object.keys(snippets).length} snippets)`);
    passed++;
  } else {
    console.log('✗ Snippets file missing');
    failed++;
  }
  
  // Test 4: All required commands are registered
  const pkg = JSON.parse(fs.readFileSync(path.join(extDir, 'package.json'), 'utf-8'));
  const expectedCommands = [
    'promptos.insertPrompt',
    'promptos.listPrompts', 
    'promptos.loadPrompt',
    'promptos.refreshPrompts'
  ];
  
  const commands = pkg.contributes.commands.map(c => c.command);
  const allCommandsPresent = expectedCommands.every(c => commands.includes(c));
  
  if (allCommandsPresent) {
    console.log('✓ All required commands registered');
    passed++;
  } else {
    console.log('✗ Some commands missing');
    failed++;
  }
  
  // Test 5: Keybindings configured
  if (pkg.contributes.keybindings && pkg.contributes.keybindings.length > 0) {
    console.log('✓ Keybindings configured');
    passed++;
  } else {
    console.log('✗ No keybindings configured');
    failed++;
  }
  
  // Test 6: Configuration options
  if (pkg.contributes.configuration) {
    const configProps = Object.keys(pkg.contributes.configuration.properties);
    console.log(`✓ Configuration options (${configProps.length})`);
    passed++;
  } else {
    console.log('✗ No configuration options');
    failed++;
  }
  
  // Test 7: Hover provider configured
  if (pkg.activationEvents.includes('onCommand:promptos.insertPrompt')) {
    console.log('✓ Activation events configured');
    passed++;
  } else {
    console.log('✗ No activation events');
    failed++;
  }
  
  console.log('\n==============================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  
  return failed === 0;
}

const success = validateExtension();
process.exit(success ? 0 : 1);
