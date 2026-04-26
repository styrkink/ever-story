import { emailTransactionalQueue } from 'queue';
import { emailVerificationService } from '../services/emailVerificationService';

type Locale = 'ru' | 'en' | 'de' | 'fr';

const JOB_OPTIONS = {
  priority: 10,
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 5000 },
  removeOnComplete: 100,
  removeOnFail: 500,
};

export async function enqueueVerificationEmail(params: {
  userId: string;
  to: string;
  userName: string;
  locale: Locale;
}): Promise<void> {
  const { userId, to, userName, locale } = params;

  const verifyToken = await emailVerificationService.generateToken(userId);

  await emailTransactionalQueue.add(
    'verify-email',
    {
      type: 'verify-email',
      userId,
      to,
      locale,
      data: { verifyToken, userName },
    },
    JOB_OPTIONS,
  );
}

export async function enqueuePasswordResetEmail(params: {
  userId: string;
  to: string;
  userName: string;
  resetToken: string;
  locale: Locale;
}): Promise<void> {
  const { userId, to, userName, resetToken, locale } = params;

  await emailTransactionalQueue.add(
    'password-reset',
    {
      type: 'password-reset',
      userId,
      to,
      locale,
      data: { resetToken, userName },
    },
    {
      ...JOB_OPTIONS,
      jobId: `pwd-reset-${userId}-${Date.now()}`,
    },
  );
}

export async function enqueuePasswordChangedEmail(params: {
  userId: string;
  to: string;
  userName: string;
  locale: Locale;
}): Promise<void> {
  const { userId, to, userName, locale } = params;

  await emailTransactionalQueue.add(
    'password-changed',
    {
      type: 'password-changed',
      userId,
      to,
      locale,
      data: { userName },
    },
    {
      ...JOB_OPTIONS,
      jobId: `pwd-changed-${userId}-${Date.now()}`,
    },
  );
}
