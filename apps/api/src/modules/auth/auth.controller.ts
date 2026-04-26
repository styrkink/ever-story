import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { AuthService } from './auth.service';
import { CoppaService } from './coppa.service';
import { registerSchema, loginSchema, refreshSchema } from './auth.schema';
import { AppError } from '../../utils/AppError';
import { enqueueVerificationEmail } from '../../lib/enqueueEmail';
import { emailVerificationService } from '../../services/emailVerificationService';
import { env } from '../../config/env';

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

      // Enqueue verification email (non-blocking — don't fail registration if this errors)
      enqueueVerificationEmail({ userId: tokens.userId, to: data.email, userName: '', locale: 'ru' })
        .catch((err) => server.log.error({ action: 'enqueue_verify_email_failed', email: data.email, err }));

      return reply.status(201).send({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
    },
  );

  server.post('/api/auth/login', async (request, reply) => {
    const data = loginSchema.parse(request.body);
    const tokens = await authService.login(data);
    return reply.status(200).send(tokens);
  });

  server.post('/api/auth/google', async (request, reply) => {
    const { googleAuthSchema } = require('./auth.schema');
    const data = googleAuthSchema.parse(request.body);
    const tokens = await authService.loginWithGoogle(data.token);
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

  // Email verification
  server.get<{ Params: { token: string } }>(
    '/api/auth/verify-email/:token',
    async (request, reply) => {
      const { token } = request.params;
      const userId = await emailVerificationService.verifyToken(token);

      if (!userId) return reply.redirect(`${env.APP_URL}/auth/verify-failed?reason=invalid`);

      const user = await server.prisma.user.findUnique({
        where: { id: userId },
        select: { emailVerifiedAt: true },
      });

      if (!user) return reply.redirect(`${env.APP_URL}/auth/verify-failed?reason=invalid`);

      if (!user.emailVerifiedAt) {
        await server.prisma.user.update({
          where: { id: userId },
          data: { emailVerifiedAt: new Date() },
        });
      }

      server.log.info({ action: 'verify_email_success', userId });
      return reply.redirect(`${env.APP_URL}/home?verified=1`);
    },
  );

  // Resend verification email
  server.post(
    '/api/auth/resend-verification',
    { preValidation: [server.authenticate] },
    async (request, reply) => {
      const { userId, email } = request.user;

      const user = await server.prisma.user.findUnique({
        where: { id: userId },
        select: { emailVerifiedAt: true, email: true },
      });

      if (!user) throw new AppError('User not found', 404);

      if (user.emailVerifiedAt) {
        return reply.status(400).send({ code: 'ALREADY_VERIFIED', message: 'Email is already verified' });
      }

      const rateLimitKey = `resend-verify:${userId}`;
      const existing = await server.redis.get(rateLimitKey);

      if (existing) {
        const ttl = await server.redis.ttl(rateLimitKey);
        return reply.status(429).send({ code: 'RATE_LIMITED', retryAfter: ttl });
      }

      await server.redis.set(rateLimitKey, '1', 'EX', 60);
      await emailVerificationService.invalidatePreviousTokens(userId);
      await enqueueVerificationEmail({ userId, to: user.email ?? email, userName: '', locale: 'ru' });

      return reply.status(200).send({ message: 'Verification email sent' });
    },
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
