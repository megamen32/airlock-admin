import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

const codes = new Map();

export function issueCode(payload) {
  const code = crypto.randomBytes(32).toString('hex');
  codes.set(code, { ...payload, created: Date.now() });
  return code;
}

export function consumeCode(code) {
  const data = codes.get(code);
  if (!data) return null;
  codes.delete(code);

  if (Date.now() - data.created > 5 * 60 * 1000) {
    return null;
  }

  return data;
}

export function verifyPkce(verifier, challenge) {
  if (!verifier || !challenge) return false;
  const hash = crypto.createHash('sha256').update(verifier).digest('base64url');
  return hash === challenge;
}

export function issueAccessToken(secret, payload) {
  return jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn: '12h',
    issuer: 'https://gptadminmcp.bezrabotnyi.com',
    audience: payload.resource,
  });
}

export function verifyAccessToken(secret, token, resource) {
  return jwt.verify(token, secret, {
    algorithms: ['HS256'],
    issuer: 'https://gptadminmcp.bezrabotnyi.com',
    audience: resource,
  });
}
