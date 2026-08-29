const helmet = require('helmet');

function createAdminBrowserHeaders() {
  return helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    frameguard: {
      action: 'deny',
    },
    referrerPolicy: {
      policy: 'no-referrer',
    },
  });
}

module.exports = {
  createAdminBrowserHeaders,
};
