import { FastifyInstance } from 'fastify';
import { RegisterInput, LoginInput, RefreshInput } from './auth.schema';
import { AppError } from '../../utils/AppError';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export class AuthService {
  constructor(private server: FastifyInstance) {}

  async register(data: RegisterInput) {
    const existingUser = await this.server.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('User already exists', 400);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const newUser = await this.server.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
      },
    });

    return this.generateTokens(newUser);
  }

  async login(data: LoginInput) {
    const user = await this.server.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !user.passwordHash) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);

    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    return this.generateTokens(user);
  }

  async loginWithGoogle(accessToken: string) {
    let payload;
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch user info from Google');
      }
      payload = await response.json();
    } catch (error) {
      throw new AppError('Invalid Google access token', 401);
    }

    if (!payload || !payload.email) {
      throw new AppError('Invalid Google token payload', 401);
    }

    let user = await this.server.prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (!user) {
      // Create user if they don't exist
      user = await this.server.prisma.user.create({
        data: {
          email: payload.email,
        },
      });
    }

    return this.generateTokens(user);
  }

  async refresh(data: RefreshInput) {
    let decoded: any;
    try {
      decoded = this.server.jwt.verify(data.refreshToken);
    } catch (err) {
      throw new AppError('Invalid refresh token', 401);
    }

    if (decoded.type !== 'refresh') {
      throw new AppError('Invalid token type', 401);
    }

    // Checking if the refresh token is in blocklist
    const isBlocked = await this.server.redis.get(`blocklist:${decoded.jti}`);
    if (isBlocked) {
      throw new AppError('Invalid refresh token', 401);
    }

    // Per-user blocklist (e.g. password reset invalidates all active sessions)
    if (decoded.userId && decoded.iat) {
      const userBlockTs = await this.server.redis.get(`jwt-blocklist:${decoded.userId}`);
      if (userBlockTs && Number(userBlockTs) > decoded.iat * 1000) {
        throw new AppError('Session expired. Please sign in again.', 401);
      }
    }

    const user = await this.server.prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Block the old refresh token (sliding session)
    await this.blockToken(decoded.jti, 30 * 24 * 60 * 60);

    return this.generateTokens(user);
  }

  async blockToken(jti: string, expiresInSecs: number) {
    await this.server.redis.set(`blocklist:${jti}`, 'blocked', 'EX', expiresInSecs);
  }

  private generateTokens(user: any) {
    const accessJti = crypto.randomUUID();
    const accessToken = this.server.jwt.sign(
      {
        userId: user.id,
        email: user.email,
        coppaVerifiedAt: user.coppaVerifiedAt,
        type: 'access',
        jti: accessJti,
      },
      { expiresIn: '15m' }
    );

    const refreshJti = crypto.randomUUID();
    const refreshToken = this.server.jwt.sign(
      {
        userId: user.id,
        email: user.email,
        coppaVerifiedAt: user.coppaVerifiedAt,
        type: 'refresh',
        jti: refreshJti,
      },
      { expiresIn: '30d' }
    );

    return {
      accessToken,
      refreshToken,
      userId: user.id as string,
    };
  }
}
