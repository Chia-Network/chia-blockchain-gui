import * as coreLocales from '@chia-network/core/src/locales';
import * as walletsLocales from '@chia-network/wallets/src/locales';
import { i18n } from '@lingui/core';

import * as guiLocales from '../locales';

export const defaultLocale = 'en-US';

// https://www.codetwo.com/admins-blog/list-of-office-365-language-id/
// https://www.venea.net/web/culture_code
export const locales = [
  {
    locale: 'be-BY',
    label: 'Беларускі',
  },
  {
    locale: 'bg-BG',
    label: 'български език',
  },
  {
    locale: 'ca-ES',
    label: 'Català',
  },
  {
    locale: 'cs-CZ',
    label: 'Čeština',
  },
  {
    locale: 'da-DK',
    label: 'Dansk',
  },
  {
    locale: 'de-DE',
    label: 'Deutsch',
  },
  {
    locale: 'en-US',
    label: 'English',
  },
  {
    locale: 'en-AU',
    label: 'English (Australia)',
  },
  {
    locale: 'en-NZ',
    label: 'English (New Zealand)',
  },
  {
    locale: 'en-PT',
    label: 'English (Pirate)',
  },
  {
    locale: 'es-ES',
    label: 'Español',
  },
  {
    locale: 'es-AR',
    label: 'Español (Argentina)',
  },
  {
    locale: 'es-MX',
    label: 'Español (México)',
  },
  {
    locale: 'el-GR',
    label: 'Ελληνικά',
  },
  {
    locale: 'fr-FR',
    label: 'Français',
  },
  {
    locale: 'hr-HR',
    label: 'Hrvatski',
  },
  {
    locale: 'id-ID',
    label: 'Indonesia',
  },
  {
    locale: 'it-IT',
    label: 'Italiano',
  },
  {
    locale: 'hu-HU',
    label: 'Magyar',
  },
  {
    locale: 'nl-NL',
    label: 'Nederlands',
  },
  {
    locale: 'no-NO',
    label: 'Norsk bokmål',
  },
  {
    locale: 'fa-IR',
    label: 'فارسی',
  },
  {
    locale: 'pl-PL',
    label: 'Polski',
  },
  {
    locale: 'pt-PT',
    label: 'Português',
  },
  {
    locale: 'pt-BR',
    label: 'Português (Brasil)',
  },
  {
    locale: 'ro-RO',
    label: 'Română',
  },
  {
    locale: 'ru-RU',
    label: 'Русский',
  },
  {
    locale: 'sq-AL',
    label: 'Shqipe',
  },
  {
    locale: 'sk-SK',
    label: 'Slovenčina',
  },
  {
    locale: 'sr-SP',
    label: 'Srpski',
  },
  {
    locale: 'fi-FI',
    label: 'Suomi',
  },
  {
    locale: 'sv-SE',
    label: 'Svenska',
  },
  {
    locale: 'tr-TR',
    label: 'Türkçe',
  },
  {
    locale: 'uk-UA',
    label: 'Українська',
  },
  {
    locale: 'ar-SA',
    label: '(العربية (المملكة العربية السعودية',
  },
  {
    locale: 'ko-KR',
    label: '한국어',
  },
  /* {
  locale: 'vi-VN',
  label: 'Tiếng Việt',
}, */ {
    locale: 'zh-TW',
    label: '繁體中文',
  },
  {
    locale: 'zh-CN',
    label: '简体中文',
  },
  {
    locale: 'ja-JP',
    label: '日本語 (日本)',
  },
];

locales.forEach(({ locale }) => {
  const importName = locale.replace('-', '');

  const messages = {
    ...coreLocales[importName].messages,
    ...walletsLocales[importName].messages,
    ...guiLocales[importName].messages,
  };

  i18n.load(locale, messages);
});

export { i18n };
