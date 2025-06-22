import type { I18n } from '@lingui/core';
import moment from 'moment';

export default function activateLocale(i18n: I18n, locale: string) {
  i18n.activate(locale);
  moment.locale([locale, 'en']);

  if (typeof window !== 'undefined') {
    window.appAPI.setLocale(locale);
  }
}
