import { describe, it, expect, vi, beforeEach } from 'vitest';

const redisMock = vi.hoisted(() => ({
  set: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
  mget: vi.fn(),
  scan: vi.fn(),
  incr: vi.fn(),
  expire: vi.fn(),
  ttl: vi.fn(),
}));

vi.mock('../config/env', () => ({
  env: {
    REDIS_URL: 'redis://localhost:6379',
    PASSWORD_RESET_SECRET: 'test-secret-that-is-at-least-32-characters-long!!',
  },
}));

vi.mock('../lib/redis', () => ({ redis: redisMock }));

import { PasswordResetService } from './passwordResetService';

type PrismaUser = {
  id: string;
  email: string;
  passwordResetToken: string | null;
  passwordResetExpiresAt: Date | null;
};

function makePrismaMock(initial: Partial<Record<string, PrismaUser>> = {}) {
  const usersById = new Map<string, PrismaUser>();
  for (const u of Object.values(initial)) {
    if (u) usersById.set(u.id, u);
  }

  return {
    user: {
      update: vi.fn(async ({ where, data }: any) => {
        const existing = usersById.get(where.id);
        if (!existing) throw new Error(`user not found: ${where.id}`);
        const updated: PrismaUser = { ...existing, ...data };
        usersById.set(where.id, updated);
        return updated;
      }),
      findUnique: vi.fn(async ({ where }: any) => {
        return usersById.get(where.id) ?? null;
      }),
      findFirst: vi.fn(async ({ where }: any) => {
        for (const u of usersById.values()) {
          if (where.passwordResetToken && u.passwordResetToken !== where.passwordResetToken) continue;
          if (where.passwordResetExpiresAt?.gt && (!u.passwordResetExpiresAt || u.passwordResetExpiresAt <= where.passwordResetExpiresAt.gt)) continue;
          return u;
        }
        return null;
      }),
    },
    _users: usersById,
  };
}

describe('PasswordResetService', () => {
  let service: PasswordResetService;

  beforeEach(() => {
    service = new PasswordResetService();
    vi.clearAllMocks();
  });

  describe('generateToken', () => {
    it('returns a base64url string and persists hash + redis key', async () => {
      const prisma = makePrismaMock({
        u1: { id: 'user-123', email: 'test@example.com', passwordResetToken: null, passwordResetExpiresAt: null },
      });
      service.setPrisma(prisma as any);
      redisMock.set.mockResolvedValue('OK');

      const token = await service.generateToken('user-123', 'test@example.com');

      expect(typeof token).toBe('string');
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);

      expect(prisma.user.update).toHaveBeenCalledOnce();
      const updateArgs = (prisma.user.update as any).mock.calls[0][0];
      expect(updateArgs.where).toEqual({ id: 'user-123' });
      expect(typeof updateArgs.data.passwordResetToken).toBe('string');
      expect(updateArgs.data.passwordResetExpiresAt).toBeInstanceOf(Date);

      expect(redisMock.set).toHaveBeenCalledOnce();
      const [key, value, , ttl] = redisMock.set.mock.calls[0];
      expect(key).toMatch(/^pwd-reset:/);
      expect(value).toBe('user-123');
      expect(ttl).toBe(3600);
    });
  });

  describe('verifyToken', () => {
    it('returns userId+email for a valid token (Redis + DB hit)', async () => {
      const prisma = makePrismaMock({
        u1: { id: 'user-456', email: 'a@b.com', passwordResetToken: null, passwordResetExpiresAt: null },
      });
      service.setPrisma(prisma as any);
      redisMock.set.mockResolvedValue('OK');

      const token = await service.generateToken('user-456', 'a@b.com');

      const [storedKey] = redisMock.set.mock.calls[0];
      redisMock.get.mockResolvedValue('user-456');

      const result = await service.verifyToken(token);
      expect(result).toEqual({ userId: 'user-456', email: 'a@b.com' });
      expect(redisMock.get).toHaveBeenCalledWith(storedKey);
    });

    it('returns null for tampered HMAC', async () => {
      const prisma = makePrismaMock();
      service.setPrisma(prisma as any);

      const result = await service.verifyToken('aW52YWxpZC50b2tlbg==');
      expect(result).toBeNull();
      expect(redisMock.get).not.toHaveBeenCalled();
    });

    it('returns null when Redis key is missing (expired)', async () => {
      const prisma = makePrismaMock({
        u1: { id: 'user-exp', email: 'x@y.com', passwordResetToken: null, passwordResetExpiresAt: null },
      });
      service.setPrisma(prisma as any);
      redisMock.set.mockResolvedValue('OK');

      const token = await service.generateToken('user-exp', 'x@y.com');
      redisMock.get.mockResolvedValue(null);

      const result = await service.verifyToken(token);
      expect(result).toBeNull();
    });

    it('returns null for malformed input', async () => {
      const prisma = makePrismaMock();
      service.setPrisma(prisma as any);

      const result = await service.verifyToken('not-a-valid-token-at-all!!!');
      expect(result).toBeNull();
    });
  });

  describe('consumeToken', () => {
    it('returns userId, deletes redis key, and clears DB fields', async () => {
      const prisma = makePrismaMock({
        u1: { id: 'user-cons', email: 'c@d.com', passwordResetToken: null, passwordResetExpiresAt: null },
      });
      service.setPrisma(prisma as any);
      redisMock.set.mockResolvedValue('OK');

      const token = await service.generateToken('user-cons', 'c@d.com');
      redisMock.get.mockResolvedValue('user-cons');
      redisMock.del.mockResolvedValue(1);

      const userId = await service.consumeToken(token);
      expect(userId).toBe('user-cons');

      const updateCalls = (prisma.user.update as any).mock.calls;
      const lastUpdate = updateCalls[updateCalls.length - 1][0];
      expect(lastUpdate.data).toEqual({
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      });

      expect(redisMock.del).toHaveBeenCalledOnce();
    });

    it('returns null when token is invalid', async () => {
      const prisma = makePrismaMock();
      service.setPrisma(prisma as any);
      redisMock.get.mockResolvedValue(null);

      const result = await service.consumeToken('invalid');
      expect(result).toBeNull();
    });
  });

  describe('isRateLimited', () => {
    it('first 3 requests are allowed', async () => {
      const prisma = makePrismaMock();
      service.setPrisma(prisma as any);

      redisMock.incr.mockResolvedValueOnce(1);
      redisMock.expire.mockResolvedValue(1);
      let result = await service.isRateLimited('user@test.com');
      expect(result.limited).toBe(false);

      redisMock.incr.mockResolvedValueOnce(2);
      result = await service.isRateLimited('user@test.com');
      expect(result.limited).toBe(false);

      redisMock.incr.mockResolvedValueOnce(3);
      result = await service.isRateLimited('user@test.com');
      expect(result.limited).toBe(false);
    });

    it('4th request is rate-limited with retryAfter', async () => {
      const prisma = makePrismaMock();
      service.setPrisma(prisma as any);

      redisMock.incr.mockResolvedValueOnce(4);
      redisMock.ttl.mockResolvedValueOnce(1800);

      const result = await service.isRateLimited('user@test.com');
      expect(result.limited).toBe(true);
      expect(result.retryAfter).toBe(1800);
    });

    it('sets TTL only on first increment', async () => {
      const prisma = makePrismaMock();
      service.setPrisma(prisma as any);

      redisMock.incr.mockResolvedValueOnce(1);
      await service.isRateLimited('first@test.com');
      expect(redisMock.expire).toHaveBeenCalledOnce();

      redisMock.expire.mockClear();
      redisMock.incr.mockResolvedValueOnce(2);
      await service.isRateLimited('first@test.com');
      expect(redisMock.expire).not.toHaveBeenCalled();
    });
  });

  describe('invalidateAllUserTokens', () => {
    it('clears DB fields and removes redis key', async () => {
      const prisma = makePrismaMock({
        u1: {
          id: 'user-inv',
          email: 'inv@test.com',
          passwordResetToken: 'existing-hash',
          passwordResetExpiresAt: new Date(Date.now() + 60_000),
        },
      });
      service.setPrisma(prisma as any);

      redisMock.del.mockResolvedValue(1);
      redisMock.scan.mockResolvedValueOnce(['0', []]);

      await service.invalidateAllUserTokens('user-inv');

      expect(prisma.user.update).toHaveBeenCalled();
      const updateCall = (prisma.user.update as any).mock.calls[0][0];
      expect(updateCall.data).toEqual({
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      });

      expect(redisMock.del).toHaveBeenCalledWith('pwd-reset:existing-hash');
    });
  });
});
