import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { createHash } from 'crypto';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { passwordResetService } from '../../services/passwordResetService';
import { enqueuePasswordResetEmail, enqueuePasswordChangedEmail } from '../../lib/enqueueEmail';

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one digit'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type Locale = 'ru' | 'en' | 'de' | 'fr';

function parseAcceptLanguage(header: string | undefined): Locale {
  if (!header) return 'en';
  const primary = header.split(',')[0]?.trim().toLowerCase().split('-')[0];
  if (primary === 'ru' || primary === 'de' || primary === 'fr') return primary;
  return 'en';
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const visible = local.slice(0, 1);
  const masked = '*'.repeat(Math.max(local.length - 1, 3));
  return `${visible}${masked}@${domain}`;
}

function hashEmail(email: string): string {
  return createHash('sha256').update(email.toLowerCase().trim()).digest('hex').slice(0, 16);
}

const MIN_RESPONSE_TIME_MS = 200;

async function padResponseTime(startedAt: number): Promise<void> {
  const elapsed = Date.now() - startedAt;
  if (elapsed < MIN_RESPONSE_TIME_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_RESPONSE_TIME_MS - elapsed));
  }
}

export const passwordResetController: FastifyPluginAsync = async (server: FastifyInstance) => {
  passwordResetService.setPrisma(server.prisma);

  // POST /api/auth/forgot-password
  server.post(
    '/api/auth/forgot-password',
    {
      config: {
        rateLimit: {
          max: 10,
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
      const startedAt = Date.now();
      const { email } = forgotPasswordSchema.parse(request.body);
      const locale = parseAcceptLanguage(request.headers['accept-language']);

      const rateLimit = await passwordResetService.isRateLimited(email);
      if (rateLimit.limited) {
        await padResponseTime(startedAt);
        return reply.status(429).send({
          code: 'RATE_LIMITED',
          retryAfter: rateLimit.retryAfter,
          message: 'Too many password reset requests. Please try again later.',
        });
      }

      const user = await server.prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true },
      });

      const genericResponse = {
        message: 'If this email exists, you will receive a reset link',
      };

      if (!user) {
        server.log.info({
          action: 'password_reset_requested',
          emailHash: hashEmail(email),
          found: false,
          duration: Date.now() - startedAt,
        });
        await padResponseTime(startedAt);
        return reply.status(200).send(genericResponse);
      }

      try {
        await passwordResetService.invalidateAllUserTokens(user.id);
        const resetToken = await passwordResetService.generateToken(user.id, user.email);

        await enqueuePasswordResetEmail({
          userId: user.id,
          to: user.email,
          userName: '',
          resetToken,
          locale,
        });

        server.log.info({
          action: 'password_reset_requested',
          userId: user.id,
          emailHash: hashEmail(email),
          found: true,
          duration: Date.now() - startedAt,
        });
      } catch (err) {
        server.log.error({
          action: 'password_reset_request_failed',
          userId: user.id,
          emailHash: hashEmail(email),
          err,
        });
        // Still return generic response — don't leak internal errors
      }

      await padResponseTime(startedAt);
      return reply.status(200).send(genericResponse);
    },
  );

  // GET /api/auth/reset-password/:token/validate
  server.get<{ Params: { token: string } }>(
    '/api/auth/reset-password/:token/validate',
    async (request, reply) => {
      const { token } = request.params;
      const result = await passwordResetService.verifyToken(token);

      if (!result) {
        return reply.status(400).send({
          code: 'TOKEN_INVALID_OR_EXPIRED',
          message: 'This reset link is invalid or has expired.',
        });
      }

      return reply.status(200).send({
        valid: true,
        email: maskEmail(result.email),
      });
    },
  );

  // POST /api/auth/reset-password
  server.post('/api/auth/reset-password', async (request, reply) => {
    const data = resetPasswordSchema.parse(request.body);

    const userId = await passwordResetService.consumeToken(data.token);
    if (!userId) {
      return reply.status(400).send({
        code: 'TOKEN_INVALID_OR_EXPIRED',
        message: 'This reset link is invalid or has expired. Please request a new one.',
      });
    }

    const passwordHash = await bcrypt.hash(data.newPassword, 12);

    const user = await server.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
      select: { id: true, email: true },
    });

    // Invalidate all active sessions for this user (refresh + access tokens)
    await server.redis.set(`jwt-blocklist:${userId}`, Date.now().toString(), 'EX', 30 * 24 * 60 * 60);

    server.log.info({ action: 'password_reset_success', userId });

    const locale = parseAcceptLanguage(request.headers['accept-language']);

    enqueuePasswordChangedEmail({
      userId,
      to: user.email,
      userName: '',
      locale,
    }).catch((err) => server.log.error({ action: 'enqueue_password_changed_failed', userId, err }));

    return reply.status(200).send({ message: 'Password reset successful' });
  });
};
