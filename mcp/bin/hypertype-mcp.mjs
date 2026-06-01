#!/usr/bin/env node
import { startStdio } from '../src/server.mjs';

startStdio().catch((e) => {
  console.error(`hypertype-mcp failed to start: ${e.message}`);
  process.exit(1);
});
