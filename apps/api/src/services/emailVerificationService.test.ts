import { describe, it, expect, vi, beforeEach } from 'vitest';

const redisMock = vi.hoisted(() => ({
  set: vi.fn(),
  get: vi.fn(),
  del: vi.fn(),
  mget: vi.fn(),
  scan: vi.fn(),
}));

vi.mock('../config/env', () => ({
  env: {
    REDIS_URL: 'redis://localhost:6379',
    EMAIL_VERIFY_SECRET: 'test-secret-that-is-at-least-32-characters-long!!',
  },
}));

vi.mock('../lib/redis', () => ({ redis: redisMock }));

import { EmailVerificationService } from './emailVerificationService';

describe('EmailVerificationService', () => {
  let service: EmailVerificationService;

  beforeEach(() => {
    service = new EmailVerificationService();
    vi.clearAllMocks();
  });

  describe('generateToken', () => {
    it('returns a non-empty base64url string', async () => {
      redisMock.set.mockResolvedValue('OK');

      const token = await service.generateToken('user-123');

      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      // base64url characters only
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('stores the userId in Redis with a TTL key', async () => {
      redisMock.set.mockResolvedValue('OK');

      await service.generateToken('user-456');

      expect(redisMock.set).toHaveBeenCalledOnce();
      const [key, value, , ttl] = redisMock.set.mock.calls[0];
      expect(key).toMatch(/^verify:/);
      expect(value).toBe('user-456');
      expect(ttl).toBe(86400);
    });
  });

  describe('verifyToken', () => {
    it('returns userId and deletes the key for a valid token', async () => {
      redisMock.set.mockResolvedValue('OK');
      redisMock.del.mockResolvedValue(1);

      const token = await service.generateToken('user-789');

      // Capture what was stored
      const [storedKey, storedUserId] = redisMock.set.mock.calls[0];
      redisMock.get.mockResolvedValue(storedUserId);

      const result = await service.verifyToken(token);

      expect(result).toBe('user-789');
      expect(redisMock.del).toHaveBeenCalledWith(storedKey);
    });

    it('returns null for a tampered token', async () => {
      const result = await service.verifyToken('aW52YWxpZC50b2tlbg==');
      expect(result).toBeNull();
      expect(redisMock.get).not.toHaveBeenCalled();
    });

    it('returns null for a completely invalid string', async () => {
      const result = await service.verifyToken('not-a-valid-token-at-all!!!');
      expect(result).toBeNull();
    });

    it('returns null when Redis key is missing (expired)', async () => {
      redisMock.set.mockResolvedValue('OK');
      const token = await service.generateToken('user-expired');

      // Simulate key expired / missing
      redisMock.get.mockResolvedValue(null);

      const result = await service.verifyToken(token);
      expect(result).toBeNull();
      expect(redisMock.del).not.toHaveBeenCalled();
    });
  });

  describe('invalidatePreviousTokens', () => {
    it('deletes keys belonging to the target userId', async () => {
      redisMock.scan
        .mockResolvedValueOnce(['0', ['verify:aaa', 'verify:bbb', 'verify:ccc']])
      redisMock.mget.mockResolvedValue(['user-target', 'other-user', 'user-target']);
      redisMock.del.mockResolvedValue(2);

      await service.invalidatePreviousTokens('user-target');

      expect(redisMock.del).toHaveBeenCalledWith('verify:aaa', 'verify:ccc');
    });

    it('does nothing when no matching keys exist', async () => {
      redisMock.scan.mockResolvedValueOnce(['0', []]);

      await service.invalidatePreviousTokens('user-nobody');

      expect(redisMock.del).not.toHaveBeenCalled();
    });
  });
});
