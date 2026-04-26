import { createHash, createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { PrismaClient } from 'db';
import { redis } from '../lib/redis';
import { env } from '../config/env';

export class PasswordResetError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'PasswordResetError';
  }
}

export class TokenExpiredError extends PasswordResetError {
  constructor() {
    super('TOKEN_EXPIRED', 'Password reset token has expired');
    this.name = 'TokenExpiredError';
  }
}

export class TokenInvalidError extends PasswordResetError {
  constructor() {
    super('TOKEN_INVALID', 'Password reset token is invalid');
    this.name = 'TokenInvalidError';
  }
}

export class RateLimitError extends PasswordResetError {
  constructor(public retryAfter: number) {
    super('RATE_LIMITED', 'Too many password reset requests');
    this.name = 'RateLimitError';
  }
}

const TOKEN_TTL_SECONDS = 60 * 60; // 1 hour
const RATE_LIMIT_TTL_SECONDS = 60 * 60; // 1 hour
const RATE_LIMIT_MAX = 3;

function signToken(uuid: string): string {
  return createHmac('sha256', env.PASSWORD_RESET_SECRET).update(uuid).digest('hex');
}

function encodeToken(uuid: string, hmac: string): string {
  return Buffer.from(`${uuid}.${hmac}`).toString('base64url');
}

function decodeToken(token: string): { uuid: string; hmac: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const dotIdx = decoded.indexOf('.');
    if (dotIdx === -1) return null;
    return { uuid: decoded.slice(0, dotIdx), hmac: decoded.slice(dotIdx + 1) };
  } catch {
    return null;
  }
}

function hashRawToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

function redisTokenKey(tokenHash: string): string {
  return `pwd-reset:${tokenHash}`;
}

function emailHash(email: string): string {
  return createHash('sha256').update(email.toLowerCase().trim()).digest('hex').slice(0, 16);
}

function rateLimitKey(email: string): string {
  return `pwd-reset-rate:${emailHash(email)}`;
}

export class PasswordResetService {
  private _prisma: PrismaClient | null = null;

  setPrisma(client: PrismaClient): void {
    this._prisma = client;
  }

  private get prisma(): PrismaClient {
    if (!this._prisma) {
      throw new Error('PasswordResetService: prisma client not initialized. Call setPrisma() first.');
    }
    return this._prisma;
  }

  async generateToken(userId: string, _userEmail: string): Promise<string> {
    const uuid = randomUUID();
    const hmac = signToken(uuid);
    const rawToken = encodeToken(uuid, hmac);
    const tokenHash = hashRawToken(rawToken);
    const expiresAt = new Date(Date.now() + TOKEN_TTL_SECONDS * 1000);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetToken: tokenHash,
        passwordResetExpiresAt: expiresAt,
      },
    });

    await redis.set(redisTokenKey(tokenHash), userId, 'EX', TOKEN_TTL_SECONDS);

    return rawToken;
  }

  async verifyToken(rawToken: string): Promise<{ userId: string; email: string } | null> {
    const parts = decodeToken(rawToken);
    if (!parts) return null;

    const { uuid, hmac } = parts;
    const expectedHmac = signToken(uuid);

    try {
      const a = Buffer.from(hmac, 'hex');
      const b = Buffer.from(expectedHmac, 'hex');
      if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    } catch {
      return null;
    }

    const tokenHash = hashRawToken(rawToken);

    // Fast path: Redis lookup
    const cachedUserId = await redis.get(redisTokenKey(tokenHash));
    if (!cachedUserId) return null;

    // Source of truth: PostgreSQL (also enforces expiry)
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: tokenHash,
        passwordResetExpiresAt: { gt: new Date() },
      },
      select: { id: true, email: true },
    });

    if (!user) return null;

    return { userId: user.id, email: user.email };
  }

  async consumeToken(rawToken: string): Promise<string | null> {
    const verified = await this.verifyToken(rawToken);
    if (!verified) return null;

    const tokenHash = hashRawToken(rawToken);

    await this.prisma.user.update({
      where: { id: verified.userId },
      data: {
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });

    await redis.del(redisTokenKey(tokenHash));

    return verified.userId;
  }

  async invalidateAllUserTokens(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordResetToken: true },
    });

    if (user?.passwordResetToken) {
      await redis.del(redisTokenKey(user.passwordResetToken));
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });

    // Also sweep any orphaned keys for this userId
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'pwd-reset:*', 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length === 0) continue;

      const values = await redis.mget(...keys);
      const toDelete = keys.filter((_, i) => values[i] === userId);
      if (toDelete.length > 0) {
        await redis.del(...toDelete);
      }
    } while (cursor !== '0');
  }

  async isRateLimited(email: string): Promise<{ limited: boolean; retryAfter?: number }> {
    const key = rateLimitKey(email);
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, RATE_LIMIT_TTL_SECONDS);
    }

    if (count > RATE_LIMIT_MAX) {
      const ttl = await redis.ttl(key);
      return { limited: true, retryAfter: ttl > 0 ? ttl : RATE_LIMIT_TTL_SECONDS };
    }

    return { limited: false };
  }
}

export const passwordResetService = new PasswordResetService();
