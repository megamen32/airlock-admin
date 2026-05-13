import 'dotenv/config';

import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';

import { z } from 'zod';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from '@modelcontextprotocol/ext-apps/server';

import {
  listServers,
  execOnServer,
} from './lib/gptadmin-api.js';

const widgetHtml = readFileSync('./public/admin-widget.html', 'utf8');

function createAdminServer() {
  const server = new McpServer({
    name: 'gptadmin-app',
    version: '0.1.0',
  });

  registerAppResource(
    server,
    'admin-widget',
    'ui://widget/admin.html',
    {},
    async () => ({
      contents: [{
        uri: 'ui://widget/admin.html',
        mimeType: RESOURCE_MIME_TYPE,
        text: widgetHtml,
      }],
    })
  );

  registerAppTool(server, 'list_servers', {
    title: 'List servers',
    description: 'List GPTAdmin servers',
    inputSchema: {},
    outputSchema: {
      servers: z.array(z.any()),
    },
    _meta: {
      ui: {
        resourceUri: 'ui://widget/admin.html',
      },
    },
  }, async () => {
    const servers = await listServers();

    return {
      content: [{
        type: 'text',
        text: `Found ${servers.length} servers`,
      }],
      structuredContent: {
        servers,
      },
    };
  });

  registerAppTool(server, 'exec_command', {
    title: 'Execute command',
    description: 'Execute command on server',
    inputSchema: {
      server: z.string(),
      cmd: z.string(),
    },
    outputSchema: {
      stdout: z.string().optional(),
      stderr: z.string().optional(),
      returncode: z.number().optional(),
    },
    _meta: {
      ui: {
        resourceUri: 'ui://widget/admin.html',
      },
    },
  }, async ({ server, cmd }) => {
    const result = await execOnServer(server, cmd);

    return {
      content: [{
        type: 'text',
        text: `Executed on ${server}`,
      }],
      structuredContent: result,
    };
  });

  return server;
}

const port = Number(process.env.PORT || 8787);
const MCP_PATH = '/mcp';
const MCP_AUTH_TOKEN = process.env.MCP_AUTH_TOKEN;

const httpServer = createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400).end('Missing URL');
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && url.pathname === '/') {
    res.writeHead(200, {
      'content-type': 'text/plain',
    });

    res.end('GPTAdmin MCP App');
    return;
  }

  if (req.method === 'OPTIONS' && url.pathname === MCP_PATH) {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type, mcp-session-id',
      'Access-Control-Expose-Headers': 'Mcp-Session-Id',
    });

    res.end();
    return;
  }

  const methods = new Set(['GET', 'POST', 'DELETE']);

  if (url.pathname === MCP_PATH && methods.has(req.method)) {
    if (MCP_AUTH_TOKEN) {
      const auth = req.headers.authorization || '';
      const expected = `Bearer ${MCP_AUTH_TOKEN}`;

      if (auth !== expected) {
        res.writeHead(401, {
          'content-type': 'application/json',
          'www-authenticate': 'Bearer realm=\"gptadmin-mcp\"',
        });

        res.end(JSON.stringify({
          error: 'unauthorized',
        }));

        return;
      }
    }
    const server = createAdminServer();

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (err) {
      console.error(err);

      if (!res.headersSent) {
        res.writeHead(500).end('Internal server error');
      }
    }

    return;
  }

  res.writeHead(404).end('Not found');
});

httpServer.listen(port, () => {
  console.log(`GPTAdmin MCP listening on :${port}/mcp`);
});
