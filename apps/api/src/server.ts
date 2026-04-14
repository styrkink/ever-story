import Fastify from 'fastify';
import { setupErrorHandler } from './plugins/errorHandler';
import redisPlugin from './plugins/redis';
import prismaPlugin from './plugins/prisma';
import jwtPlugin from './plugins/jwt';
import fastifyMultipart from '@fastify/multipart';
import fastifyRawBody from 'fastify-raw-body';
import { env } from './config/env';
import { authController } from './modules/auth/auth.controller';
import { webhookController } from './modules/webhooks/webhook.controller';
import { childrenController } from './modules/children/children.controller';
import fastifyWebsocket from '@fastify/websocket';
import storiesRoutes from './modules/stories/stories.routes';
import { setupStoriesWebsockets } from './modules/stories/stories.ws';
const server = Fastify({
  logger: process.env.NODE_ENV !== 'test',
});

// Setup Plugins
setupErrorHandler(server);

server.register(fastifyRawBody, {
  field: 'rawBody',
  global: false,
  encoding: 'utf8',
  runFirst: true,
});

server.register(fastifyMultipart, {
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

server.register(redisPlugin);
server.register(prismaPlugin);
server.register(jwtPlugin);
server.register(fastifyWebsocket);

// Setup Routes
server.register(authController);
server.register(webhookController);
server.register(childrenController);
server.register(storiesRoutes, { prefix: '/api/stories' });

// Websocket routes
setupStoriesWebsockets(server);

server.get('/', async (request, reply) => {
  return { status: 'ok', service: 'EverStory API' }
});

server.get('/api', async (request, reply) => {
  return { status: 'ok', service: 'EverStory API', apiVersion: '1.0.0' }
});

const start = async () => {
  try {
    await server.listen({ port: env.PORT, host: '0.0.0.0' });
    server.log.info(`Server listening on port ${env.PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};
start();
