import { usePrefs } from '@chia-network/api-react';
import type { I18n } from '@lingui/core';
import { I18nProvider } from '@lingui/react';
import React, { useMemo, createContext, useCallback, ReactNode, useEffect } from 'react';

import activateLocale from '../../utils/activateLocale';

export const LocaleContext = createContext<
  | {
      defaultLocale: string;
      locales: {
        locale: string;
        label: string;
      }[];
      locale: string;
      setLocale: (locale: string) => void;
    }
  | undefined
>(undefined);

export type LocaleProviderProps = {
  i18n: I18n;
  defaultLocale: string;
  locales: {
    locale: string;
    label: string;
  }[];
  children?: ReactNode;
};

export default function LocaleProvider(props: LocaleProviderProps) {
  const { children, i18n, locales, defaultLocale } = props;

  const [localeState, setLocale] = usePrefs<string>('locale', defaultLocale);
  let locale = localeState;
  if (typeof locale !== 'string' || (locale && locale.length === 2)) {
    locale = defaultLocale;
  }

  const handleSetLocale = useCallback(
    (localeLocal: string) => {
      if (typeof localeLocal !== 'string') {
        throw new Error(`Locale ${locales} is not a string`);
      }
      setLocale(localeLocal);
    },
    [locales, setLocale]
  );

  const context = useMemo(
    () => ({
      locales,
      defaultLocale,
      locale,
      setLocale: handleSetLocale,
    }),
    [locales, defaultLocale, locale, handleSetLocale]
  );

  // prepare default locale
  useMemo(() => {
    activateLocale(i18n, defaultLocale);
  }, [defaultLocale, i18n]);

  useEffect(() => {
    activateLocale(i18n, locale);
  }, [i18n, locale]);

  return (
    <LocaleContext.Provider value={context}>
      <I18nProvider i18n={i18n}>{children}</I18nProvider>
    </LocaleContext.Provider>
  );
}
