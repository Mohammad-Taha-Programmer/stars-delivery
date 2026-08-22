const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const jwt = require('jsonwebtoken');
const requireAdminSession = require('../src/middleware/requireAdminSession');
const { createAdminSessionOptions } = require('../src/middleware/adminSession');
const { loadSecurityConfig, validateSecret } = require('../src/config');
const { isValidAdminPassword } = require('../src/security/passwordPolicy');
const authenticateSocket = require('../src/socket/authenticateSocket');

const secret = 'a'.repeat(32);

function assertThrows(fn, message) {
  assert.throws(fn, new RegExp(message));
}

function runAdminMiddleware(session, originalUrl = '/admin') {
  let nextCalled = false;
  let statusCode;
  let redirectPath;
  const req = { session, originalUrl };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json() { return this; },
    redirect(path) { redirectPath = path; return this; },
  };
  requireAdminSession(req, res, () => { nextCalled = true; });
  return { nextCalled, statusCode, redirectPath };
}

test('missing JWT secret is rejected', () => {
  assertThrows(() => loadSecurityConfig({ SESSION_SECRET: secret }), 'JWT_SECRET is required');
});

test('missing session secret is rejected', () => {
  assertThrows(() => loadSecurityConfig({ JWT_SECRET: secret }), 'SESSION_SECRET is required');
});

test('weak security secrets are rejected', () => {
  assertThrows(() => validateSecret('JWT_SECRET', 'short'), 'at least 32 characters');
});

test('valid security secrets are accepted without changing them', () => {
  const config = loadSecurityConfig({ JWT_SECRET: secret, SESSION_SECRET: `${secret}b` });
  assert.equal(config.jwtSecret, secret);
  assert.equal(config.sessionSecret, `${secret}b`);
});

test('unauthenticated admin session is rejected for pages and APIs', () => {
  assert.equal(runAdminMiddleware(undefined).redirectPath, '/admin/login');
  assert.equal(runAdminMiddleware(undefined, '/api/chat/admin/conversations').statusCode, 401);
});

test('authenticated admin session is accepted', () => {
  const result = runAdminMiddleware({ admin: { id: 'admin-id', role: 'admin' } });
  assert.equal(result.nextCalled, true);
});

test('admin session middleware uses persistent session store and secure cookie settings', () => {
  const store = new EventEmitter();
  store.get = () => {};
  store.set = () => {};
  store.destroy = () => {};
  const options = createAdminSessionOptions({ mongoUri: 'mongodb://unused/test', sessionSecret: secret, store });
  assert.equal(options.store, store);
  assert.equal(options.name, 'stars_admin.sid');
  assert.equal(options.resave, false);
  assert.equal(options.saveUninitialized, false);
  assert.equal(options.cookie.httpOnly, true);
  assert.equal(options.cookie.sameSite, 'lax');
  assert.equal(options.cookie.secure, false);

  const productionOptions = createAdminSessionOptions({
    mongoUri: 'mongodb://unused/test',
    sessionSecret: secret,
    store,
    isProduction: true,
  });
  assert.equal(productionOptions.cookie.secure, true);
});

test('admin=true query parameter alone does not authenticate a socket', () => {
  assertThrows(() => authenticateSocket({
    request: {},
    handshake: { query: { admin: 'true' }, auth: {} },
  }, secret), 'Authentication required');
});

test('valid administrator session authenticates an admin socket', () => {
  const identity = authenticateSocket({
    request: { session: { admin: { id: 'admin-id', role: 'admin' } } },
    handshake: { query: { admin: 'true' }, auth: {} },
  }, secret);
  assert.deepEqual(identity, { id: 'admin-id', role: 'admin' });
});

test('customer and provider JWTs authenticate mobile sockets', () => {
  for (const role of ['customer', 'provider']) {
    const token = jwt.sign({ id: `${role}-id`, role }, secret);
    const identity = authenticateSocket({ request: {}, handshake: { auth: { token } } }, secret);
    assert.deepEqual(identity, { id: `${role}-id`, role });
  }
});

test('admin and unknown JWT roles are rejected from mobile sockets', () => {
  for (const role of ['admin', 'unknown']) {
    const token = jwt.sign({ id: `${role}-id`, role }, secret);
    assertThrows(() => authenticateSocket({ request: {}, handshake: { auth: { token } } }, secret), 'Invalid authentication');
  }
});

test('admin password policy rejects the legacy password', () => {
  assert.equal(isValidAdminPassword('admin123'), false);
});

test('admin password policy accepts a strong password', () => {
  assert.equal(isValidAdminPassword('A secure administrator password 2026!'), true);
});