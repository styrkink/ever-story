import { z } from 'zod';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env explicitly if needed
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  JWT_SECRET: z.string().min(32),
  REDIS_URL: z.string().url(),
  DATABASE_URL: z.string().url(),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  ENCRYPTION_KEY: z.string().min(32, 'Encryption key must be at least 32 characters'),
  RESEND_API_KEY: z.string().startsWith('re_'),
  EMAIL_VERIFY_SECRET: z.string().min(32),
  PASSWORD_RESET_SECRET: z.string().min(32),
  APP_URL: z.string().url(),
  EMAIL_FROM: z.string().default('EverStory <hello@everstory.app>'),
  EMAIL_REPLY_TO: z.string().email().default('support@everstory.app'),
  EMAIL_UNSUBSCRIBE_URL: z.string().url().default('https://everstory.app/unsubscribe'),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Invalid environment variables:', parseResult.error.format());
  process.exit(1);
}

export const env = parseResult.data;
