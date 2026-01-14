const parseCookieString = (cookieString) => {
    if (!cookieString) return {};
    return cookieString.split(';').reduce((acc, pair) => {
        const [rawKey, ...rawValue] = pair.trim().split('=');
        if (!rawKey) return acc;
        const value = rawValue.join('=');
        acc[rawKey] = decodeURIComponent(value || '');
        return acc;
    }, {});
};

const createMemoryCookies = () => {
    const jar = new Map();
    return {
        get: (key) => jar.get(key) ?? null,
        set: (key, value) => {
            jar.set(key, String(value));
        },
        remove: (key) => {
            jar.delete(key);
        }
    };
};

const createBrowserCookies = () => ({
    get: (key) => {
        const cookies = parseCookieString(document.cookie || '');
        return cookies[key] ?? null;
    },
    set: (key, value) => {
        document.cookie = `${key}=${encodeURIComponent(String(value))}; path=/`;
    },
    remove: (key) => {
        document.cookie = `${key}=; Max-Age=0; path=/`;
    }
});

const shouldUseMemoryCookies = () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return true;
    const ua = window.navigator?.userAgent ?? '';
    return ua.toLowerCase().includes('jsdom');
};

export const createCookies = () => (
    shouldUseMemoryCookies() ? createMemoryCookies() : createBrowserCookies()
);
