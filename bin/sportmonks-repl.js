#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Determine which REPL to run based on arguments
const isAdvanced = process.argv.includes('--advanced') || process.argv.includes('-a');
const replFile = isAdvanced ? 'repl-advanced.ts' : 'repl.ts';
const replPath = path.join(__dirname, '..', 'tools', replFile);

// Check if tsx is available globally, otherwise use npx
const tsxCommand = process.platform === 'win32' ? 'tsx.cmd' : 'tsx';

// Spawn the REPL process
const replProcess = spawn(tsxCommand, [replPath], {
  stdio: 'inherit',
  shell: true
});

// Handle errors
replProcess.on('error', (err) => {
  if (err.code === 'ENOENT') {
    // tsx not found, try with npx
    console.log('tsx not found globally, trying with npx...');
    const npxProcess = spawn('npx', ['tsx', replPath], {
      stdio: 'inherit',
      shell: true
    });
    
    npxProcess.on('error', (npxErr) => {
      console.error('Failed to start REPL:', npxErr.message);
      console.error('\nPlease ensure you have tsx installed:');
      console.error('  npm install -g tsx');
      process.exit(1);
    });
    
    npxProcess.on('exit', (code) => {
      process.exit(code || 0);
    });
  } else {
    console.error('Failed to start REPL:', err.message);
    process.exit(1);
  }
});

// Forward exit code
replProcess.on('exit', (code) => {
  process.exit(code || 0);
});