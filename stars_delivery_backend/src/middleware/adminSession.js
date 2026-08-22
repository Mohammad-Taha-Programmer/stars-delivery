const session = require('express-session');
const MongoStore = require('connect-mongo').default;

const ADMIN_SESSION_COOKIE = 'stars_admin.sid';
const SESSION_TTL_SECONDS = 24 * 60 * 60;

function createAdminSessionOptions({ mongoUri, sessionSecret, store, isProduction = process.env.NODE_ENV === 'production' }) {
  return {
    name: ADMIN_SESSION_COOKIE,
    secret: sessionSecret,
    store: store || MongoStore.create({
      mongoUrl: mongoUri,
      collectionName: 'admin_sessions',
      ttl: SESSION_TTL_SECONDS,
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      maxAge: SESSION_TTL_SECONDS * 1000,
    },
  };
}

function createAdminSessionMiddleware(options) {
  return session(createAdminSessionOptions(options));
}

module.exports = { ADMIN_SESSION_COOKIE, createAdminSessionOptions, createAdminSessionMiddleware };