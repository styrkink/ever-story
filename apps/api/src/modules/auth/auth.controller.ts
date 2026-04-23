import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { AuthService } from './auth.service';
import { CoppaService } from './coppa.service';
import { registerSchema, loginSchema, refreshSchema } from './auth.schema';
import { AppError } from '../../utils/AppError';

export const authController: FastifyPluginAsync = async (server: FastifyInstance) => {
  const authService = new AuthService(server);

  server.post(
    '/api/auth/register',
    {
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '1 minute',
          errorResponseBuilder: () => ({
            statusCode: 429,
            error: 'Too Many Requests',
            message: 'Слишком много запросов. Попробуйте позже.',
          }),
        },
      },
    },
    async (request, reply) => {
      const data = registerSchema.parse(request.body);
      const tokens = await authService.register(data);
      return reply.status(201).send(tokens);
    },
  );

  server.post('/api/auth/login', async (request, reply) => {
    const data = loginSchema.parse(request.body);
    const tokens = await authService.login(data);
    return reply.status(200).send(tokens);
  });

  server.post('/api/auth/refresh', async (request, reply) => {
    const data = refreshSchema.parse(request.body);
    const tokens = await authService.refresh(data);
    return reply.status(200).send(tokens);
  });

  server.post(
    '/api/auth/logout',
    { preValidation: [server.authenticate] },
    async (request, reply) => {
      const { jti, type } = request.user;
      
      const { refreshToken } = request.body as { refreshToken?: string } || {};
      
      // Block access token for 15m
      if (jti) {
        await authService.blockToken(jti, 15 * 60);
      }

      // Block refresh token if provided
      if (refreshToken) {
         try {
           const decoded: any = server.jwt.verify(refreshToken);
           if (decoded.jti && decoded.type === 'refresh') {
             await authService.blockToken(decoded.jti, 30 * 24 * 60 * 60);
           }
         } catch(e) {
           // Safely ignore expired refresh tokens during logout
         }
      }

      return reply.status(200).send({ success: true, message: 'Logged out successfully' });
    }
  );

  server.get(
    '/api/auth/me',
    { preValidation: [server.authenticate] },
    async (request, reply) => {
      const user = await server.prisma.user.findUnique({
        where: { id: request.user.userId },
        select: {
          id: true,
          email: true,
          coppaVerifiedAt: true,
          subscriptionTier: true,
          region: true,
          createdAt: true,
        }
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      return reply.status(200).send(user);
    }
  );

  server.post(
    '/api/auth/verify-coppa',
    { preValidation: [server.authenticate] },
    async (request, reply) => {
      const coppaService = new CoppaService(server);
      const result = await coppaService.createVerificationIntent(request.user.userId);
      return reply.status(200).send(result);
    }
  );
};
