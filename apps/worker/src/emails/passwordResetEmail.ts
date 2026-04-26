type Locale = 'ru' | 'en' | 'de' | 'fr';

interface RenderParams {
  userName: string;
  resetUrl: string;
  locale: Locale;
  tokenExpiry: string;
  year?: number;
  unsubUrl?: string;
}

interface RenderResult {
  html: string;
  text: string;
  subject: string;
  preheader: string;
}

const i18n = {
  ru: {
    subject: '🔑 Сброс пароля EverStory — ссылка действительна 1 час',
    preheader: 'Запрос на сброс пароля получен. Если это были не вы — просто проигнорируйте письмо.',
    heroTitle: 'Сброс пароля',
    heroSubtitle: 'Вы можете создать новый пароль по ссылке ниже',
    greeting: (name: string) => name ? `Привет, ${name} 👋` : 'Привет! 👋',
    body1: 'Мы получили запрос на сброс пароля для вашего аккаунта EverStory. Если это были вы — нажмите кнопку ниже и создайте новый пароль.',
    body2: 'Если вы не запрашивали сброс — просто проигнорируйте это письмо. Ваш аккаунт останется в безопасности.',
    ctaButton: '🔑 Создать новый пароль',
    warningTitle: 'Важно',
    warningText: (hours: string) => `Ссылка действительна ${hours} час. После истечения срока вам потребуется запросить новое письмо. Если вы не запрашивали сброс пароля — ваш аккаунт в безопасности, никаких действий не требуется.`,
    fallbackLabel: 'Если кнопка не работает — скопируйте ссылку',
    securityNotice: 'В целях безопасности после смены пароля все активные сессии будут завершены.',
    footerPrivacy: 'Политика конфиденциальности',
    footerSupport: 'Поддержка',
    footerUnsubscribe: 'Отписаться',
    footerReason: 'Вы получили это письмо, потому что кто-то запросил сброс пароля для аккаунта на everstory.app',
  },
  en: {
    subject: '🔑 EverStory password reset — link valid for 1 hour',
    preheader: 'Password reset requested. If this wasn\'t you — just ignore this email.',
    heroTitle: 'Reset your password',
    heroSubtitle: 'Create a new password using the link below',
    greeting: (name: string) => name ? `Hi, ${name} 👋` : 'Hi there! 👋',
    body1: 'We received a request to reset the password for your EverStory account. If this was you — click the button below to create a new password.',
    body2: 'If you didn\'t request a password reset — just ignore this email. Your account will remain secure.',
    ctaButton: '🔑 Create new password',
    warningTitle: 'Heads up',
    warningText: (hours: string) => `This link is valid for ${hours} hour. After it expires, you\'ll need to request a new email. If you didn\'t request a password reset — your account is safe, no action is needed.`,
    fallbackLabel: 'If the button doesn\'t work, copy this link',
    securityNotice: 'For security, all active sessions will be signed out after your password is changed.',
    footerPrivacy: 'Privacy Policy',
    footerSupport: 'Support',
    footerUnsubscribe: 'Unsubscribe',
    footerReason: 'You received this because someone requested a password reset for your everstory.app account',
  },
  de: {
    subject: '🔑 EverStory Passwort zurücksetzen — Link 1 Stunde gültig',
    preheader: 'Passwort-Reset angefordert. Falls du das nicht warst — ignoriere diese E-Mail einfach.',
    heroTitle: 'Passwort zurücksetzen',
    heroSubtitle: 'Erstelle ein neues Passwort über den Link unten',
    greeting: (name: string) => name ? `Hallo, ${name} 👋` : 'Hallo! 👋',
    body1: 'Wir haben eine Anfrage zum Zurücksetzen des Passworts für dein EverStory-Konto erhalten. Falls du das warst — klicke auf den Button unten, um ein neues Passwort zu erstellen.',
    body2: 'Falls du kein Passwort-Reset angefordert hast — ignoriere diese E-Mail einfach. Dein Konto bleibt sicher.',
    ctaButton: '🔑 Neues Passwort erstellen',
    warningTitle: 'Wichtig',
    warningText: (hours: string) => `Dieser Link ist ${hours} Stunde gültig. Danach musst du eine neue E-Mail anfordern. Falls du kein Passwort-Reset angefordert hast — ist dein Konto sicher, es sind keine Maßnahmen erforderlich.`,
    fallbackLabel: 'Falls der Button nicht funktioniert, kopiere diesen Link',
    securityNotice: 'Aus Sicherheitsgründen werden nach der Passwortänderung alle aktiven Sitzungen beendet.',
    footerPrivacy: 'Datenschutzerklärung',
    footerSupport: 'Support',
    footerUnsubscribe: 'Abmelden',
    footerReason: 'Du erhältst diese E-Mail, weil jemand ein Passwort-Reset für dein everstory.app-Konto angefordert hat',
  },
  fr: {
    subject: '🔑 Réinitialisation du mot de passe EverStory — lien valable 1 heure',
    preheader: 'Demande de réinitialisation reçue. Si ce n\'était pas vous — ignorez simplement cet e-mail.',
    heroTitle: 'Réinitialiser votre mot de passe',
    heroSubtitle: 'Créez un nouveau mot de passe via le lien ci-dessous',
    greeting: (name: string) => name ? `Bonjour, ${name} 👋` : 'Bonjour ! 👋',
    body1: 'Nous avons reçu une demande de réinitialisation du mot de passe pour votre compte EverStory. Si c\'était vous — cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.',
    body2: 'Si vous n\'avez pas demandé de réinitialisation — ignorez simplement cet e-mail. Votre compte restera sécurisé.',
    ctaButton: '🔑 Créer un nouveau mot de passe',
    warningTitle: 'Important',
    warningText: (hours: string) => `Ce lien est valable ${hours} heure. Après expiration, vous devrez demander un nouvel e-mail. Si vous n\'avez pas demandé de réinitialisation — votre compte est en sécurité, aucune action n\'est nécessaire.`,
    fallbackLabel: 'Si le bouton ne fonctionne pas, copiez ce lien',
    securityNotice: 'Pour des raisons de sécurité, toutes les sessions actives seront déconnectées après le changement de mot de passe.',
    footerPrivacy: 'Politique de confidentialité',
    footerSupport: 'Support',
    footerUnsubscribe: 'Se désabonner',
    footerReason: 'Vous avez reçu cet e-mail car quelqu\'un a demandé une réinitialisation du mot de passe pour votre compte everstory.app',
  },
} as const;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderPasswordResetEmail(params: RenderParams): RenderResult {
  const { userName, resetUrl, locale, tokenExpiry, year = new Date().getFullYear(), unsubUrl } = params;
  const t = i18n[locale];
  const unsubscribeUrl = unsubUrl ?? 'https://everstory.app/unsubscribe';

  const safeResetUrl = escapeHtml(resetUrl);
  const safeUnsubUrl = escapeHtml(unsubscribeUrl);

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="${locale}">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${escapeHtml(t.subject)}</title>
  <style type="text/css">
    @media (prefers-color-scheme: dark) {
      .email-body { background-color: #1e1a2e !important; }
      .email-text { color: #c4b8dc !important; }
      .email-greeting { color: #e8dff5 !important; }
      .email-warning-box { background-color: #2a2510 !important; border-color: #f5c842 !important; }
      .email-warning-text { color: #e8d48a !important; }
      .email-fallback-box { background-color: #2a2040 !important; border-color: #4a3870 !important; }
      .email-footer-wrap { background-color: #150f24 !important; }
    }
    @media only screen and (max-width: 620px) {
      .email-wrapper { width: 100% !important; }
      .email-content { padding: 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f4f1f9;font-family:Georgia,'Times New Roman',Times,serif;">

  <!-- Preheader -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(t.preheader)}&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;&nbsp;&#8204;</div>

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f1f9;">
    <tr>
      <td align="center" style="padding:20px 0 40px;">

        <!-- Email container -->
        <table class="email-wrapper" width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(75,45,140,0.10);">

          <!-- Header -->
          <tr>
            <td style="background-color:#1a1034;padding:36px 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;margin-right:10px;">
                      <polygon points="14,2 17.5,10.5 26,11.5 19.5,17.5 21.5,26 14,21.5 6.5,26 8.5,17.5 2,11.5 10.5,10.5" fill="#f5e6c8" stroke="#f5e6c8" stroke-width="1"/>
                    </svg>
                    <span style="font-family:Georgia,'Times New Roman',Times,serif;font-size:20px;color:#ffffff;font-weight:normal;vertical-align:middle;">EverStory</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="background-color:#1a1034;padding:0 40px 40px;">
              <p style="margin:0 0 16px;font-size:48px;line-height:1;display:block;">🔑</p>
              <h1 style="margin:0 0 10px;font-family:Georgia,'Times New Roman',Times,serif;font-size:26px;font-weight:normal;color:#f5e6c8;line-height:1.3;">${escapeHtml(t.heroTitle)}</h1>
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;color:#a89bc2;line-height:1.6;">${escapeHtml(t.heroSubtitle)}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="email-body email-content" style="background-color:#faf9f7;padding:40px;" align="left">

              <!-- Greeting -->
              <p class="email-greeting" style="margin:0 0 20px;font-family:Georgia,'Times New Roman',Times,serif;font-size:16px;color:#3d2e5a;line-height:1.7;">${escapeHtml(t.greeting(userName))}</p>

              <!-- Body text -->
              <p class="email-text" style="margin:0 0 16px;font-family:Georgia,'Times New Roman',Times,serif;font-size:15px;color:#5a4e72;line-height:1.7;">${escapeHtml(t.body1)}</p>
              <p class="email-text" style="margin:0 0 28px;font-family:Georgia,'Times New Roman',Times,serif;font-size:15px;color:#5a4e72;line-height:1.7;">${escapeHtml(t.body2)}</p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
                <tr>
                  <td align="center">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
                      href="${safeResetUrl}"
                      style="height:48px;v-text-anchor:middle;width:260px;"
                      arcsize="50%"
                      stroke="f"
                      fillcolor="#4b2d8c">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;font-weight:bold;">
                        ${escapeHtml(t.ctaButton)}
                      </center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${safeResetUrl}"
                       style="display:inline-block;background-color:#4b2d8c;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;font-weight:bold;text-decoration:none;padding:14px 40px;border-radius:100px;mso-padding-alt:0;line-height:1.4;"
                       target="_blank"
                       rel="noopener noreferrer">
                      <!--[if mso]>&nbsp;&nbsp;&nbsp;&nbsp;<![endif]-->
                      ${escapeHtml(t.ctaButton)}
                      <!--[if mso]>&nbsp;&nbsp;&nbsp;&nbsp;<![endif]-->
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>

              <!-- Warning box -->
              <table class="email-warning-box" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fff8e6;border-left:3px solid #f5c842;border-radius:6px;margin-bottom:24px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="margin:0 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#7a5c00;font-weight:bold;text-transform:uppercase;letter-spacing:0.5px;">⚠️ ${escapeHtml(t.warningTitle)}</p>
                    <p class="email-warning-text" style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#7a5c00;line-height:1.6;">${escapeHtml(t.warningText(tokenExpiry))}</p>
                  </td>
                </tr>
              </table>

              <!-- Fallback link box -->
              <table class="email-fallback-box" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0ecf8;border:1px solid #d4c8ee;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;color:#8b7aaa;text-transform:uppercase;letter-spacing:0.5px;">${escapeHtml(t.fallbackLabel)}</p>
                    <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:11px;color:#5a4090;word-break:break-all;line-height:1.5;">
                      <a href="${safeResetUrl}" style="color:#5a4090;text-decoration:none;">${safeResetUrl}</a>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #e0d8f0;margin:0 0 24px;" />

              <!-- Security notice -->
              <p class="email-text" style="margin:0;font-family:Georgia,'Times New Roman',Times,serif;font-size:13px;color:#8b7aaa;line-height:1.7;font-style:italic;">${escapeHtml(t.securityNotice)}</p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="email-footer-wrap" style="background-color:#f0ecf8;padding:24px 40px;">
              <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#9d8fc0;text-align:center;line-height:1.6;">
                &copy; ${year} EverStory &mdash;
                <a href="https://everstory.app/privacy" style="color:#9d8fc0;text-decoration:underline;">${escapeHtml(t.footerPrivacy)}</a>
                &nbsp;&bull;&nbsp;
                <a href="https://everstory.app/support" style="color:#9d8fc0;text-decoration:underline;">${escapeHtml(t.footerSupport)}</a>
                &nbsp;&bull;&nbsp;
                <a href="${safeUnsubUrl}" style="color:#9d8fc0;text-decoration:underline;">${escapeHtml(t.footerUnsubscribe)}</a>
              </p>
              <p style="margin:0 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#9d8fc0;text-align:center;line-height:1.5;">
                EverStory Inc. &bull; 651 N Broad St, Middletown, DE 19709, USA
              </p>
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#9d8fc0;text-align:center;line-height:1.5;">
                ${escapeHtml(t.footerReason)}
              </p>
            </td>
          </tr>

        </table>
        <!-- /Email container -->

      </td>
    </tr>
  </table>

</body>
</html>`;

  const text = renderPlainText({ userName, resetUrl, locale, tokenExpiry, unsubUrl: unsubscribeUrl });

  return { html, text, subject: t.subject, preheader: t.preheader };
}

function renderPlainText(params: RenderParams & { unsubUrl: string }): string {
  const { userName, resetUrl, locale, tokenExpiry, unsubUrl } = params;
  const t = i18n[locale];
  const divider = '─'.repeat(40);

  return [
    `EverStory — ${t.heroTitle}`,
    divider,
    '',
    t.greeting(userName),
    '',
    t.body1,
    '',
    t.body2,
    '',
    `${t.ctaButton}:`,
    resetUrl,
    '',
    `⚠️ ${t.warningText(tokenExpiry)}`,
    '',
    t.securityNotice,
    '',
    '—',
    'EverStory · everstory.app',
    t.footerReason,
    `${t.footerSupport}: support@everstory.app`,
    `${t.footerUnsubscribe}: ${unsubUrl}`,
  ].join('\n');
}
