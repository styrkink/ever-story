type Locale = 'ru' | 'en' | 'de' | 'fr';

interface RenderParams {
  userName: string;
  verifyUrl: string;
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
    subject: '✨ Подтвердите почту — и первая сказка уже ждёт',
    preheader: 'Один клик — и ваш ребёнок становится героем сказки 🌙',
    heroTitle: 'Один шаг до первой сказки',
    heroSubtitle: 'Подтвердите почту, чтобы начать создавать',
    greeting: (name: string) => name ? `Привет, ${name} 👋` : 'Привет! 👋',
    body1: 'Спасибо, что присоединились к EverStory. Мы готовы помочь вам превратить обычный вечер в особенный семейный момент — где ваш ребёнок становится главным героем собственной сказки.',
    body2: 'Осталось только подтвердить ваш email — и первая история уже ждёт вас:',
    ctaButton: '✨ Подтвердить email',
    fallbackLabel: 'Если кнопка не работает — скопируйте ссылку',
    warning: (hours: string) => `⏰ Ссылка действительна ${hours} часа. Если вы не регистрировались в EverStory — просто проигнорируйте это письмо.`,
    ps: 'P.S. После подтверждения вы сразу попадёте на главную — уже через 90 секунд можно будет прочитать первую сказку вместе с ребёнком 🌟',
    footerPrivacy: 'Политика конфиденциальности',
    footerUnsubscribe: 'Отписаться',
    footerReason: 'Вы получили это письмо, потому что зарегистрировались на everstory.app',
  },
  en: {
    subject: '✨ Confirm your email — your first story is waiting',
    preheader: 'One click and your child becomes the hero of their story 🌙',
    heroTitle: 'One step to your first story',
    heroSubtitle: 'Confirm your email and start creating magic',
    greeting: (name: string) => name ? `Hi, ${name} 👋` : 'Hi there! 👋',
    body1: 'Thanks for joining EverStory. We\'re here to help you turn any ordinary evening into a magical family moment — where your child becomes the hero of their very own story.',
    body2: 'Just one click to confirm your email — and your first story is already waiting:',
    ctaButton: '✨ Confirm my email',
    fallbackLabel: 'If the button doesn\'t work, copy this link',
    warning: (hours: string) => `⏰ This link expires in ${hours} hours. If you didn\'t create an EverStory account — just ignore this email.`,
    ps: 'P.S. After confirming, you\'ll land straight on the home page — your first bedtime story can be ready in 90 seconds 🌟',
    footerPrivacy: 'Privacy Policy',
    footerUnsubscribe: 'Unsubscribe',
    footerReason: 'You received this because you signed up at everstory.app',
  },
  de: {
    subject: '✨ E-Mail bestätigen — deine erste Geschichte wartet',
    preheader: 'Ein Klick — und dein Kind wird zum Helden seiner Geschichte 🌙',
    heroTitle: 'Ein Schritt bis zur ersten Geschichte',
    heroSubtitle: 'Bestätige deine E-Mail und fang an zu zaubern',
    greeting: (name: string) => name ? `Hallo, ${name} 👋` : 'Hallo! 👋',
    body1: 'Danke, dass du EverStory beigetreten bist. Wir helfen dir, jeden gewöhnlichen Abend in einen besonderen Familienmoment zu verwandeln — wo dein Kind zum Helden seiner eigenen Geschichte wird.',
    body2: 'Nur noch ein Klick, um deine E-Mail zu bestätigen — und deine erste Geschichte wartet schon:',
    ctaButton: '✨ E-Mail bestätigen',
    fallbackLabel: 'Falls der Button nicht funktioniert, kopiere diesen Link',
    warning: (hours: string) => `⏰ Dieser Link ist ${hours} Stunden gültig. Falls du kein EverStory-Konto erstellt hast — ignoriere diese E-Mail einfach.`,
    ps: 'P.S. Nach der Bestätigung landest du direkt auf der Startseite — deine erste Gutenachtgeschichte kann in 90 Sekunden fertig sein 🌟',
    footerPrivacy: 'Datenschutzerklärung',
    footerUnsubscribe: 'Abmelden',
    footerReason: 'Du erhältst diese E-Mail, weil du dich bei everstory.app registriert hast',
  },
  fr: {
    subject: '✨ Confirmez votre e-mail — votre première histoire attend',
    preheader: 'Un clic et votre enfant devient le héros de son histoire 🌙',
    heroTitle: 'Une étape avant votre première histoire',
    heroSubtitle: 'Confirmez votre e-mail et commencez à créer de la magie',
    greeting: (name: string) => name ? `Bonjour, ${name} 👋` : 'Bonjour ! 👋',
    body1: 'Merci d\'avoir rejoint EverStory. Nous sommes là pour vous aider à transformer une soirée ordinaire en un moment familial magique — où votre enfant devient le héros de sa propre histoire.',
    body2: 'Il ne reste qu\'un clic pour confirmer votre e-mail — et votre première histoire vous attend déjà :',
    ctaButton: '✨ Confirmer mon e-mail',
    fallbackLabel: 'Si le bouton ne fonctionne pas, copiez ce lien',
    warning: (hours: string) => `⏰ Ce lien est valable ${hours} heures. Si vous n\'avez pas créé de compte EverStory — ignorez simplement cet e-mail.`,
    ps: 'P.S. Après confirmation, vous arriverez directement sur la page d\'accueil — votre première histoire peut être prête en 90 secondes 🌟',
    footerPrivacy: 'Politique de confidentialité',
    footerUnsubscribe: 'Se désabonner',
    footerReason: 'Vous avez reçu cet e-mail car vous vous êtes inscrit sur everstory.app',
  },
} as const;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderVerifyEmail(params: RenderParams): RenderResult {
  const { userName, verifyUrl, locale, tokenExpiry, year = new Date().getFullYear(), unsubUrl } = params;
  const t = i18n[locale];
  const unsubscribeUrl = unsubUrl ?? 'https://everstory.app/unsubscribe';

  const safeVerifyUrl = escapeHtml(verifyUrl);
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
              <p style="margin:0 0 16px;font-size:48px;line-height:1;display:block;">🌙</p>
              <h1 style="margin:0 0 10px;font-family:Georgia,'Times New Roman',Times,serif;font-size:26px;font-weight:normal;color:#f5e6c8;line-height:1.3;">${escapeHtml(t.heroTitle)}</h1>
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;color:#a89bc2;line-height:1.6;">${escapeHtml(t.heroSubtitle)}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="email-body" style="background-color:#faf9f7;padding:40px;" align="left">

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
                      href="${safeVerifyUrl}"
                      style="height:48px;v-text-anchor:middle;width:240px;"
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
                    <a href="${safeVerifyUrl}"
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

              <!-- Fallback link box -->
              <table class="email-fallback-box" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0ecf8;border:1px solid #d4c8ee;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0 0 6px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;color:#8b7aaa;text-transform:uppercase;letter-spacing:0.5px;">${escapeHtml(t.fallbackLabel)}</p>
                    <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:11px;color:#5a4090;word-break:break-all;line-height:1.5;">
                      <a href="${safeVerifyUrl}" style="color:#5a4090;text-decoration:none;">${safeVerifyUrl}</a>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Warning -->
              <p class="email-text" style="margin:0 0 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#8b7aaa;line-height:1.6;">${escapeHtml(t.warning(tokenExpiry))}</p>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #e0d8f0;margin:0 0 24px;" />

              <!-- P.S. -->
              <p class="email-text" style="margin:0;font-family:Georgia,'Times New Roman',Times,serif;font-size:14px;color:#8b7aaa;line-height:1.7;font-style:italic;">${escapeHtml(t.ps)}</p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="email-footer-wrap" style="background-color:#f0ecf8;padding:24px 40px;">
              <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#9d8fc0;text-align:center;line-height:1.6;">
                &copy; ${year} EverStory &mdash;
                <a href="https://everstory.app/privacy" style="color:#9d8fc0;text-decoration:underline;">${escapeHtml(t.footerPrivacy)}</a>
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

  const text = renderPlainText({ userName, verifyUrl, locale, tokenExpiry, unsubUrl: unsubscribeUrl });

  return { html, text, subject: t.subject, preheader: t.preheader };
}

function renderPlainText(params: RenderParams & { unsubUrl: string }): string {
  const { userName, verifyUrl, locale, tokenExpiry, unsubUrl } = params;
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
    verifyUrl,
    '',
    t.warning(tokenExpiry),
    '',
    '—',
    t.ps,
    '',
    'EverStory · everstory.app',
    t.footerReason,
    `${t.footerUnsubscribe}: ${unsubUrl}`,
  ].join('\n');
}
