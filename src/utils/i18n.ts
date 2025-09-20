import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';

// Baseline locales; extend by adding more files
export const en = {
  common: {
    loading: 'Loading...',
    error: 'Error',
  },
  dashboard: {
    welcome: 'Welcome,',
    healthDashboard: 'Your Health Dashboard',
  },
};

export const fil = {
  common: {
    loading: 'Naglo-load...',
    error: 'Error',
  },
  dashboard: {
    welcome: 'Maligayang pagdating,',
    healthDashboard: 'Iyong Health Dashboard',
  },
};

const i18n = new I18n({ en, fil } as any);
i18n.locale = Localization.locale || 'en';
(i18n as any).enableFallback = true;

export const t = (key: string, options?: any) => i18n.t(key, options);

export default i18n;


