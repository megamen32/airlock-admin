import 'dotenv/config';

import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import crypto from 'node:crypto';

import { z } from 'zod';
import { issueCode, consumeCode, verifyPkce, issueAccessToken, verifyAccessToken } from './oauth.js';

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
    {
      _meta: {
        'openai/widgetDescription': 'GPTAdmin infrastructure control panel',
        'openai/widgetPrefersBorder': true,
        'openai/widgetCSP': {
          connect_domains: ['https://gptadminmcp.bezrabotnyi.com'],
          resource_domains: ['https://widgets-gptadmin.bezrabotnyi.com'],
        },
        'openai/widgetDomain': 'https://widgets-gptadmin.bezrabotnyi.com',
      },
    },
    async () => ({
      contents: [{
        uri: 'ui://widget/admin.html',
        mimeType: RESOURCE_MIME_TYPE,
        text: widgetHtml,
        _meta: {
          'openai/widgetDomain': 'https://widgets-gptadmin.bezrabotnyi.com',
        },
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
    securitySchemes: [{ type: 'oauth2', scopes: ['gptadmin.read'] }],
    _meta: {
      ui: {
        resourceUri: 'https://widgets-gptadmin.bezrabotnyi.com/admin.html',
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
    securitySchemes: [{ type: 'oauth2', scopes: ['gptadmin.exec'] }],
    _meta: {
      ui: {
        resourceUri: 'https://widgets-gptadmin.bezrabotnyi.com/admin.html',
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
const OAUTH_CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET || crypto.randomBytes(32).toString('hex');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';
const PUBLIC_ORIGIN = process.env.PUBLIC_ORIGIN || 'https://gptadminmcp.bezrabotnyi.com';
const MCP_RESOURCE = process.env.MCP_RESOURCE || PUBLIC_ORIGIN;
const OAUTH_SCOPES = ['gptadmin.read', 'gptadmin.exec'];

function isAllowedRedirectUri(uri) {
  try {
    const u = new URL(uri);

    return (
      u.protocol === 'https:' && (
        u.hostname === 'chatgpt.com' ||
        u.hostname.endsWith('.chatgpt.com')
      ) && u.pathname.startsWith('/connector/oauth/')
    );
  } catch {
    return false;
  }
}


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

  if (url.pathname === '/.well-known/oauth-protected-resource') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({
      resource: MCP_RESOURCE,
      authorization_servers: [PUBLIC_ORIGIN],
      scopes_supported: OAUTH_SCOPES,
      resource_documentation: `${PUBLIC_ORIGIN}/`,
    }));
    return;
  }

  if (url.pathname === '/.well-known/oauth-authorization-server') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({
      issuer: PUBLIC_ORIGIN,
      authorization_endpoint: `${PUBLIC_ORIGIN}/authorize`,
      token_endpoint: `${PUBLIC_ORIGIN}/token`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code'],
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: ['none'],
      client_id_metadata_document_supported: true,
      registration_endpoint: `${PUBLIC_ORIGIN}/register`,
      scopes_supported: OAUTH_SCOPES,
    }));
    return;
  }

  if (url.pathname === '/register' && req.method === 'POST') {
    res.writeHead(201, { 'content-type': 'application/json' });
    res.end(JSON.stringify({
      client_id: 'chatgpt-dynamic',
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code'],
      response_types: ['code'],
    }));
    return;
  }

  if (url.pathname === '/authorize' && req.method === 'GET') {
    const redirect = url.searchParams.get('redirect_uri');
    const state = url.searchParams.get('state') || '';
    const challenge = url.searchParams.get('code_challenge') || '';
    const clientId = url.searchParams.get('client_id') || '';
    const resource = url.searchParams.get('resource') || MCP_RESOURCE;
    const scope = url.searchParams.get('scope') || OAUTH_SCOPES.join(' ');

    if (!isAllowedRedirectUri(redirect) || resource !== MCP_RESOURCE) {
      res.writeHead(400).end('invalid redirect_uri or resource');
      return;
    }

    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(`<html><body><form method=POST action='/authorize'>
      <input type=hidden name=redirect_uri value='${redirect}'>
      <input type=hidden name=state value='${state}'>
      <input type=hidden name=code_challenge value='${challenge}'>
      <input type=hidden name=client_id value='${clientId}'>
      <input type=hidden name=resource value='${resource}'>
      <input type=hidden name=scope value='${scope}'>
      <h2>GPTAdmin MCP Authorization</h2>
      <p>Scopes: ${scope}</p>
      <input type=password name=password placeholder='Admin password'>
      <button type=submit>Authorize</button>
    </form></body></html>`);
    return;
  }

  if (url.pathname === '/authorize' && req.method === 'POST') {
    let body='';
    req.on('data', c => body += c);
    await new Promise(r => req.on('end', r));
    const params = new URLSearchParams(body);

    if (params.get('password') !== ADMIN_PASSWORD) {
      res.writeHead(403).end('invalid password');
      return;
    }

    if (!isAllowedRedirectUri(params.get('redirect_uri')) || params.get('resource') !== MCP_RESOURCE) {
      res.writeHead(400).end('invalid redirect_uri or resource');
      return;
    }

    const code = issueCode({
      challenge: params.get('code_challenge'),
      clientId: params.get('client_id'),
      resource: params.get('resource') || MCP_RESOURCE,
      scope: params.get('scope') || OAUTH_SCOPES.join(' '),
    });

    const redir = new URL(params.get('redirect_uri'));
    redir.searchParams.set('code', code);
    redir.searchParams.set('state', params.get('state'));

    res.writeHead(302, { location: redir.toString() });
    res.end();
    return;
  }

  if (url.pathname === '/token' && req.method === 'POST') {
    let body='';
    req.on('data', c => body += c);
    await new Promise(r => req.on('end', r));
    const params = new URLSearchParams(body);

    const data = consumeCode(params.get('code'));
    const resource = params.get('resource') || data?.resource || MCP_RESOURCE;

    if (!data || resource !== data.resource || resource !== MCP_RESOURCE || !verifyPkce(params.get('code_verifier'), data.challenge)) {
      res.writeHead(400).end('invalid_grant');
      return;
    }

    const token = issueAccessToken(OAUTH_CLIENT_SECRET, {
      sub: 'admin',
      scope: data.scope,
      resource: data.resource,
      client_id: data.clientId,
    });

    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({
      access_token: token,
      token_type: 'Bearer',
      expires_in: 43200,
    }));
    return;
  }

  if (url.pathname === MCP_PATH && methods.has(req.method)) {
    const auth = req.headers.authorization || '';
    const token = auth.replace(/^Bearer\s+/i, '');

    try {
      verifyAccessToken(OAUTH_CLIENT_SECRET, token, MCP_RESOURCE);
    } catch (e) {
      res.writeHead(401, {
        'content-type': 'application/json',
        'www-authenticate': `Bearer resource_metadata="${PUBLIC_ORIGIN}/.well-known/oauth-protected-resource", scope="${OAUTH_SCOPES.join(' ')}"`,
      });

      res.end(JSON.stringify({ error: 'unauthorized' }));
      return;
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
