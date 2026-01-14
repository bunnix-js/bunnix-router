const isPolicyProps = (value) => (
    value
    && typeof value === 'object'
    && !Array.isArray(value)
    && value.type !== 'RoutePolicy'
    && Object.prototype.hasOwnProperty.call(value, 'handler')
);

export const RoutePolicy = (handler, maybeChildren) => {
    if (isPolicyProps(handler) && (maybeChildren === undefined || Array.isArray(maybeChildren))) {
        const { handler: resolved } = handler;
        if (typeof resolved !== 'function') {
            throw new Error('RoutePolicy requires a handler function.');
        }
        return {
            type: 'RoutePolicy',
            handler: resolved
        };
    }
    if (typeof handler !== 'function') {
        throw new Error('RoutePolicy requires a handler function.');
    }
    return {
        type: 'RoutePolicy',
        handler
    };
};
