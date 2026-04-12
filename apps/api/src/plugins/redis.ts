import fp from 'fastify-plugin';
import Redis from 'ioredis';
import { env } from '../config/env';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}

export default fp(async (server) => {
  const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
  });

  redis.on('error', (err) => {
    server.log.error(err, 'Redis error:');
  });

  server.decorate('redis', redis);

  server.addHook('onClose', async (instance) => {
    await instance.redis.quit();
  });
});
