import { Resend } from 'resend';
import { env } from '../config/env';

const resend = new Resend(env.RESEND_API_KEY);

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const { to, subject, html, text, replyTo, tags } = params;

  const { data, error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
    text,
    replyTo: replyTo ?? env.EMAIL_REPLY_TO,
    headers: {
      'List-Unsubscribe': `<${env.EMAIL_UNSUBSCRIBE_URL}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
    tags,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }

  console.info({ action: 'email_sent', messageId: data?.id, to });
}
