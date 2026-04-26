import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { redis } from '../lib/redis';
import { env } from '../config/env';

export class EmailVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailVerificationError';
  }
}

export class TokenExpiredError extends EmailVerificationError {
  constructor() {
    super('Verification token has expired');
    this.name = 'TokenExpiredError';
  }
}

export class TokenInvalidError extends EmailVerificationError {
  constructor() {
    super('Verification token is invalid');
    this.name = 'TokenInvalidError';
  }
}

const TOKEN_TTL = 86400; // 24 hours

function signToken(uuid: string): string {
  return createHmac('sha256', env.EMAIL_VERIFY_SECRET).update(uuid).digest('hex');
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

function redisKey(tokenHash: string): string {
  return `verify:${tokenHash}`;
}

export class EmailVerificationService {
  async generateToken(userId: string): Promise<string> {
    const uuid = randomUUID();
    const hmac = signToken(uuid);
    const tokenHash = createHmac('sha256', env.EMAIL_VERIFY_SECRET).update(`${uuid}.${hmac}`).digest('hex');

    await redis.set(redisKey(tokenHash), userId, 'EX', TOKEN_TTL);

    return encodeToken(uuid, hmac);
  }

  async verifyToken(token: string): Promise<string | null> {
    const parts = decodeToken(token);
    if (!parts) return null;

    const { uuid, hmac } = parts;
    const expectedHmac = signToken(uuid);

    // Constant-time comparison to prevent timing attacks
    try {
      const a = Buffer.from(hmac, 'hex');
      const b = Buffer.from(expectedHmac, 'hex');
      if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    } catch {
      return null;
    }

    const tokenHash = createHmac('sha256', env.EMAIL_VERIFY_SECRET).update(`${uuid}.${hmac}`).digest('hex');
    const key = redisKey(tokenHash);

    const userId = await redis.get(key);
    if (!userId) return null;

    await redis.del(key);
    return userId;
  }

  async invalidatePreviousTokens(userId: string): Promise<void> {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'verify:*', 'COUNT', 100);
      cursor = nextCursor;

      if (keys.length === 0) continue;

      const values = await redis.mget(...keys);
      const toDelete = keys.filter((_, i) => values[i] === userId);

      if (toDelete.length > 0) {
        await redis.del(...toDelete);
      }
    } while (cursor !== '0');
  }
}

export const emailVerificationService = new EmailVerificationService();
