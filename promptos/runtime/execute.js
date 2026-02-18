// Redirector — the real execute.js lives at the promptos root level
// to avoid the ESM scope conflict from runtime/package.json "type": "module"
module.exports = require('../execute.js');
