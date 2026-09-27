/**
 * Safe localStorage wrapper that gracefully falls back in sandboxed iframes
 */

export function safeGetItem<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return fallback;
    }
    const item = window.localStorage.getItem(key);
    if (item === null) return fallback;
    return JSON.parse(item) as T;
  } catch {
    return fallback;
  }
}

export function safeSetItem<T>(key: string, value: T): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // Suppress quota or security errors in sandboxed iframes
  }
}

export function safeCopyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(() => true).catch(() => {
        return fallbackCopy(text);
      });
    }
    return Promise.resolve(fallbackCopy(text));
  } catch {
    return Promise.resolve(fallbackCopy(text));
  }
}

function fallbackCopy(text: string): boolean {
  try {
    if (typeof document === 'undefined') return false;
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
}

