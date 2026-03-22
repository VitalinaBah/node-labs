const fastify = require('fastify');
const apiRoutes = require('./routes/api.routes');
const errorHandler = require('./plugins/error-handler');

function buildApp() {
  const app = fastify({ logger: true });

  // ВИДАЛЕНО: config.port = 9999

  app.register(errorHandler);
  app.get('/health', async () => ({ status: 'ok' }));
  app.register(apiRoutes, { prefix: '/api' });

  return app;
}

module.exports = buildApp;