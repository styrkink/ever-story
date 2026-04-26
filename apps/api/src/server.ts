import Fastify from 'fastify';
import { setupErrorHandler } from './plugins/errorHandler';
import redisPlugin from './plugins/redis';
import prismaPlugin from './plugins/prisma';
import jwtPlugin from './plugins/jwt';
import fastifyMultipart from '@fastify/multipart';
import fastifyRawBody from 'fastify-raw-body';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyCors from '@fastify/cors';
import { env } from './config/env';
import { authController } from './modules/auth/auth.controller';
import { passwordResetController } from './modules/auth/passwordReset.controller';
import { webhookController } from './modules/webhooks/webhook.controller';
import { childrenController } from './modules/children/children.controller';
import fastifyWebsocket from '@fastify/websocket';
import storiesRoutes from './modules/stories/stories.routes';
import { setupStoriesWebsockets } from './modules/stories/stories.ws';
const server = Fastify({
  logger: process.env.NODE_ENV !== 'test',
  maxParamLength: 500,
});

// Setup Plugins
setupErrorHandler(server);

// CORS — allow frontend origins
server.register(fastifyCors, {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://everstory.app',
    'https://www.everstory.app',
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});

// Rate limiting — relaxed in test/dev, strict in production
server.register(fastifyRateLimit, {
  max: env.NODE_ENV === 'production' ? 20 : 1000,
  timeWindow: '1 minute',
  keyGenerator: (request) => request.ip,
  errorResponseBuilder: () => ({
    statusCode: 429,
    error: 'Too Many Requests',
    message: 'Слишком много запросов. Попробуйте позже.',
  }),
});

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
server.register(passwordResetController);
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
