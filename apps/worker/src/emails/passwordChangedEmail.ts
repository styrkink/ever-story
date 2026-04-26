type Locale = 'ru' | 'en' | 'de' | 'fr';

interface RenderParams {
  userName: string;
  supportUrl: string;
  locale: Locale;
  year?: number;
}

interface RenderResult {
  html: string;
  text: string;
  subject: string;
}

const i18n = {
  ru: {
    subject: '🔒 Ваш пароль EverStory был изменён',
    heroTitle: 'Пароль изменён',
    greeting: (name: string) => name ? `Привет, ${name} 👋` : 'Привет! 👋',
    body: 'Это уведомление о том, что пароль для вашего аккаунта EverStory был успешно изменён. Все активные сессии были завершены — вам нужно войти заново, используя новый пароль.',
    alert: 'Если это были не вы — немедленно свяжитесь с нашей поддержкой:',
    contactCta: 'Связаться с поддержкой',
    footerReason: 'Это служебное письмо отправлено в связи с изменением пароля на everstory.app',
  },
  en: {
    subject: '🔒 Your EverStory password was changed',
    heroTitle: 'Password changed',
    greeting: (name: string) => name ? `Hi, ${name} 👋` : 'Hi there! 👋',
    body: 'This is a notification that the password for your EverStory account was successfully changed. All active sessions have been signed out — please log in again using your new password.',
    alert: 'If this wasn\'t you — please contact our support immediately:',
    contactCta: 'Contact support',
    footerReason: 'This is a transactional email sent because your password on everstory.app was changed.',
  },
  de: {
    subject: '🔒 Dein EverStory-Passwort wurde geändert',
    heroTitle: 'Passwort geändert',
    greeting: (name: string) => name ? `Hallo, ${name} 👋` : 'Hallo! 👋',
    body: 'Dies ist eine Benachrichtigung, dass das Passwort für dein EverStory-Konto erfolgreich geändert wurde. Alle aktiven Sitzungen wurden beendet — bitte melde dich mit deinem neuen Passwort erneut an.',
    alert: 'Falls du das nicht warst — kontaktiere bitte sofort unseren Support:',
    contactCta: 'Support kontaktieren',
    footerReason: 'Diese Service-Mail wurde gesendet, weil dein Passwort auf everstory.app geändert wurde.',
  },
  fr: {
    subject: '🔒 Votre mot de passe EverStory a été modifié',
    heroTitle: 'Mot de passe modifié',
    greeting: (name: string) => name ? `Bonjour, ${name} 👋` : 'Bonjour ! 👋',
    body: 'Ceci est une notification indiquant que le mot de passe de votre compte EverStory a été modifié avec succès. Toutes les sessions actives ont été déconnectées — veuillez vous reconnecter avec votre nouveau mot de passe.',
    alert: 'Si ce n\'était pas vous — contactez immédiatement notre support :',
    contactCta: 'Contacter le support',
    footerReason: 'Cet e-mail transactionnel a été envoyé car votre mot de passe sur everstory.app a été modifié.',
  },
} as const;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderPasswordChangedEmail(params: RenderParams): RenderResult {
  const { userName, supportUrl, locale, year = new Date().getFullYear() } = params;
  const t = i18n[locale];
  const safeSupportUrl = escapeHtml(supportUrl);

  const html = `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(t.subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f1f9;font-family:Georgia,'Times New Roman',Times,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f1f9;">
    <tr>
      <td align="center" style="padding:20px 0 40px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(75,45,140,0.10);">

          <tr>
            <td style="background-color:#1a1034;padding:36px 40px 28px;">
              <span style="font-family:Georgia,'Times New Roman',Times,serif;font-size:20px;color:#ffffff;">EverStory</span>
            </td>
          </tr>

          <tr>
            <td style="background-color:#1a1034;padding:0 40px 36px;">
              <p style="margin:0 0 12px;font-size:40px;line-height:1;">🔒</p>
              <h1 style="margin:0;font-family:Georgia,serif;font-size:24px;font-weight:normal;color:#f5e6c8;">${escapeHtml(t.heroTitle)}</h1>
            </td>
          </tr>

          <tr>
            <td style="background-color:#faf9f7;padding:36px 40px;" align="left">
              <p style="margin:0 0 16px;font-family:Georgia,serif;font-size:16px;color:#3d2e5a;line-height:1.7;">${escapeHtml(t.greeting(userName))}</p>
              <p style="margin:0 0 24px;font-family:Georgia,serif;font-size:15px;color:#5a4e72;line-height:1.7;">${escapeHtml(t.body)}</p>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fff8e6;border-left:3px solid #f5c842;border-radius:6px;margin-bottom:24px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="margin:0 0 10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#7a5c00;line-height:1.6;">⚠️ ${escapeHtml(t.alert)}</p>
                    <a href="${safeSupportUrl}" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#4b2d8c;font-weight:bold;text-decoration:underline;">${escapeHtml(t.contactCta)}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color:#f0ecf8;padding:24px 40px;">
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#9d8fc0;text-align:center;line-height:1.5;">
                &copy; ${year} EverStory &bull; ${escapeHtml(t.footerReason)}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `EverStory — ${t.heroTitle}`,
    '─'.repeat(40),
    '',
    t.greeting(userName),
    '',
    t.body,
    '',
    `⚠️ ${t.alert} ${supportUrl}`,
    '',
    '—',
    'EverStory · everstory.app',
  ].join('\n');

  return { html, text, subject: t.subject };
}
