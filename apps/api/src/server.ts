import Fastify from 'fastify';
import { setupErrorHandler } from './plugins/errorHandler';
import redisPlugin from './plugins/redis';
import prismaPlugin from './plugins/prisma';
import jwtPlugin from './plugins/jwt';
import { authController } from './modules/auth/auth.controller';
import { env } from './config/env';

const server = Fastify({
  logger: process.env.NODE_ENV !== 'test',
});

// Setup Plugins
setupErrorHandler(server);

server.register(redisPlugin);
server.register(prismaPlugin);
server.register(jwtPlugin);

// Setup Routes
server.register(authController);

server.get('/', async (request, reply) => {
  return { status: 'ok', service: 'EverStory API' }
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
