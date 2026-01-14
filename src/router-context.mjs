import { createCookies } from './cookies.mjs';

export const createRouterContext = (appContext = {}) => {
    const context = { ...appContext };

    context.cookies = appContext.cookies ?? createCookies();
    context.set = (key, value) => {
        context[key] = value;
    };
    context.remove = (...keys) => {
        keys.forEach((key) => {
            delete context[key];
        });
    };

    Object.defineProperty(context, '__isRouterContext', {
        value: true,
        enumerable: false
    });

    return context;
};

export const isRouterContext = (value) => (
    !!value && typeof value === 'object' && value.__isRouterContext === true
);
