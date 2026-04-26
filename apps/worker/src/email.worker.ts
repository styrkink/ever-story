import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import { Worker } from 'bullmq';
import { connection, QUEUE_NAMES } from 'queue';
import { Resend } from 'resend';
import { renderVerifyEmail } from './emails/verifyEmail';
import { renderPasswordResetEmail } from './emails/passwordResetEmail';
import { renderPasswordChangedEmail } from './emails/passwordChangedEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

const APP_URL = process.env.APP_URL ?? 'https://everstory.app';
const API_URL = process.env.API_URL ?? 'http://localhost:3001';
const EMAIL_FROM = process.env.EMAIL_FROM ?? 'EverStory <hello@everstory.app>';
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO ?? 'support@everstory.app';
const EMAIL_UNSUBSCRIBE_URL = process.env.EMAIL_UNSUBSCRIBE_URL ?? 'https://everstory.app/unsubscribe';
const SUPPORT_URL = process.env.SUPPORT_URL ?? 'https://everstory.app/support';

type Locale = 'ru' | 'en' | 'de' | 'fr';

interface EmailJob {
  type: 'verify-email' | 'welcome' | 'password-reset' | 'password-changed';
  userId: string;
  to: string;
  locale: Locale;
  data: Record<string, string>;
}

export const initEmailWorker = () => {
  const emailWorker = new Worker<EmailJob>(
    QUEUE_NAMES.EMAIL_TRANSACTIONAL,
    async (job) => {
      const { type, to, locale, data, userId } = job.data;

      switch (type) {
        case 'verify-email': {
          const verifyUrl = `${API_URL}/api/auth/verify-email/${data.verifyToken}`;
          const { html, text, subject } = renderVerifyEmail({
            userName: data.userName ?? '',
            verifyUrl,
            locale,
            tokenExpiry: '24',
          });

          const { data: sent, error } = await resend.emails.send({
            from: EMAIL_FROM,
            to,
            subject,
            html,
            text,
            replyTo: EMAIL_REPLY_TO,
            headers: {
              'List-Unsubscribe': `<${EMAIL_UNSUBSCRIBE_URL}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
            tags: [
              { name: 'type', value: 'verify-email' },
              { name: 'userId', value: userId },
            ],
          });

          if (error) throw new Error(`Resend error: ${error.message}`);

          console.info({ action: 'verify_email_sent', messageId: sent?.id, to, userId });
          return { messageId: sent?.id };
        }

        case 'password-reset': {
          const resetUrl = `${APP_URL}/auth/reset-password/${data.resetToken}`;
          const { html, text, subject } = renderPasswordResetEmail({
            userName: data.userName ?? '',
            resetUrl,
            locale,
            tokenExpiry: '1',
          });

          const { data: sent, error } = await resend.emails.send({
            from: EMAIL_FROM,
            to,
            subject,
            html,
            text,
            replyTo: EMAIL_REPLY_TO,
            headers: {
              'List-Unsubscribe': `<${EMAIL_UNSUBSCRIBE_URL}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
            tags: [
              { name: 'type', value: 'password-reset' },
              { name: 'userId', value: userId },
            ],
          });

          if (error) throw new Error(`Resend error: ${error.message}`);

          console.info({ action: 'password_reset_sent', messageId: sent?.id, to, userId });
          return { messageId: sent?.id };
        }

        case 'password-changed': {
          const { html, text, subject } = renderPasswordChangedEmail({
            userName: data.userName ?? '',
            supportUrl: SUPPORT_URL,
            locale,
          });

          const { data: sent, error } = await resend.emails.send({
            from: EMAIL_FROM,
            to,
            subject,
            html,
            text,
            replyTo: EMAIL_REPLY_TO,
            tags: [
              { name: 'type', value: 'password-changed' },
              { name: 'userId', value: userId },
            ],
          });

          if (error) throw new Error(`Resend error: ${error.message}`);

          console.info({ action: 'password_changed_sent', messageId: sent?.id, to, userId });
          return { messageId: sent?.id };
        }

        default:
          throw new Error(`Unknown email job type: ${type}`);
      }
    },
    {
      connection,
      concurrency: 5,
    },
  );

  emailWorker.on('ready', () => {
    console.log('[EmailWorker] Email Worker is ready and listening to queue:', QUEUE_NAMES.EMAIL_TRANSACTIONAL);
  });

  emailWorker.on('failed', (job, err) => {
    console.error(`[EmailWorker] Job ${job?.id} failed (final):`, { type: job?.data?.type, to: job?.data?.to, err: err.message });
  });

  return emailWorker;
};
