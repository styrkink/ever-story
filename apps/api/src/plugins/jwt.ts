import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { env } from '../config/env';
import { FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../utils/AppError';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireCoppa: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      userId: string;
      email: string;
      coppaVerifiedAt: Date | null;
      type: 'access' | 'refresh';
      jti?: string;
    };
    user: {
      userId: string;
      email: string;
      coppaVerifiedAt: Date | null;
      type: 'access' | 'refresh';
      jti?: string;
    };
  }
}

export default fp(async (server) => {
  server.register(fastifyJwt, {
    secret: env.JWT_SECRET,
  });

  server.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      
      const { jti } = request.user;
      
      if (jti) {
        // Checking token blocklist in Redis by Token ID (jti)
        const isBlocked = await server.redis.get(`blocklist:${jti}`);
        if (isBlocked) {
          throw new AppError('Token is invalid or expired', 401);
        }
      } else {
         throw new AppError('Invalid token format', 401);
      }
      
      if (request.user.type !== 'access') {
         throw new AppError('Access token required', 401);
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('Unauthorized', 401);
    }
  });

  server.decorate('requireCoppa', async (request: FastifyRequest, reply: FastifyReply) => {
    // This assumes the request already passed "authenticate"
    if (!request.user || !request.user.coppaVerifiedAt) {
      throw new AppError('Action requires COPPA verification', 403);
    }
  });
});
