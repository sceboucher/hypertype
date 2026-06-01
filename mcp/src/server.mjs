// The hypertype MCP server: registers every tool and dispatches calls over stdio.
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { TOOLS } from './tools/index.mjs';

export function createServer() {
  const server = new Server(
    { name: 'hypertype', version: '0.1.0' },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const tool = TOOLS.find((t) => t.name === req.params.name);
    if (!tool) {
      return { isError: true, content: [{ type: 'text', text: `Unknown tool: ${req.params.name}` }] };
    }
    try {
      const result = await tool.handler(req.params.arguments ?? {});
      const text = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
      return { content: [{ type: 'text', text }] };
    } catch (e) {
      return { isError: true, content: [{ type: 'text', text: `Error: ${e.message}` }] };
    }
  });

  return server;
}

export async function startStdio() {
  const server = createServer();
  await server.connect(new StdioServerTransport());
}
