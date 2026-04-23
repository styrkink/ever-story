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
    // Deliberately query the DB instead of reading request.user.coppaVerifiedAt.
    // The JWT payload is a snapshot from token-issuance time and would be stale
    // if COPPA was verified (or revoked) after the token was issued.
    if (!request.user?.userId) {
      throw new AppError('Action requires COPPA verification', 403);
    }

    const user = await server.prisma.user.findUnique({
      where: { id: request.user.userId },
      select: { coppaVerifiedAt: true },
    });

    if (!user?.coppaVerifiedAt) {
      throw new AppError('Action requires COPPA verification', 403);
    }
  });
});
