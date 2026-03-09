/**
 * Mock for next-intl — provides translations from en.json for tests.
 */
import messages from '../../messages/en.json';

type Messages = Record<string, Record<string, string>>;

function createTranslator(namespace: string) {
  const ns = (messages as Messages)[namespace] || {};
  return function t(key: string, params?: Record<string, unknown>): string {
    let value = ns[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        // Simple placeholder replacement (handles {key} patterns)
        value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        // Handle ICU plural: {count, plural, one {x} other {y}}
        // For tests, just replace the whole plural expression with the value
        const pluralRegex = new RegExp(
          `\\{${k},\\s*plural,\\s*one\\s*\\{([^}]*)\\}\\s*other\\s*\\{([^}]*)\\}\\}`,
          'g'
        );
        value = value.replace(pluralRegex, (_match, one, other) => {
          return Number(v) === 1 ? String(one) : String(other);
        });
      });
    }
    return value;
  };
}

export function useTranslations(namespace: string) {
  const t = createTranslator(namespace);
  // Add .rich() method for tests that use it
  t.rich = t as unknown as typeof t;
  return t;
}

export function useLocale() {
  return 'en';
}

export function NextIntlClientProvider({ children }: { children: React.ReactNode }) {
  return children;
}
