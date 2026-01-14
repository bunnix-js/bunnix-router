const isRouteProps = (value) => (
    value
    && typeof value === 'object'
    && !Array.isArray(value)
    && value.type !== 'Route'
    && (
        Object.prototype.hasOwnProperty.call(value, 'path')
        || Object.prototype.hasOwnProperty.call(value, 'component')
        || value.root
        || value.notFound
        || value.forbidden
    )
);

const createRoute = (path, component = null) => ({
    type: 'Route',
    kind: 'normal',
    path,
    component
});

const createRouteFromProps = (props = {}) => {
    const { path, component = null, root, notFound, forbidden } = props;
    const flags = [root, notFound, forbidden].filter(Boolean);

    if (flags.length > 1) {
        throw new Error('Route cannot combine root/notFound/forbidden flags.');
    }
    if (path && flags.length > 0) {
        throw new Error('Route cannot combine path with root/notFound/forbidden.');
    }
    if (notFound) {
        if (!component) throw new Error('Route.notFound requires a component.');
        return Route.notFound(component);
    }
    if (forbidden) {
        if (!component) throw new Error('Route.forbidden requires a component.');
        return Route.forbidden(component);
    }
    if (root) {
        return Route.root(component ?? null);
    }
    if (!path) {
        throw new Error('Route requires a path.');
    }
    return createRoute(path, component ?? null);
};

export const Route = (path, component = null) => {
    if (isRouteProps(path) && (component === undefined || Array.isArray(component))) {
        return createRouteFromProps(path);
    }
    return createRoute(path, component);
};

Route._NOT_FOUND = '__bunnix_not_found__';
Route._FORBIDDEN = '__bunnix_forbidden__';

Route.root = (component = null) => createRoute('/', component);

const notFoundRoute = (component) => ({
    type: 'Route',
    kind: 'notFound',
    path: Route._NOT_FOUND,
    component
});
notFoundRoute.path = Route._NOT_FOUND;
Route.notFound = notFoundRoute;

const forbiddenRoute = (component) => ({
    type: 'Route',
    kind: 'forbidden',
    path: Route._FORBIDDEN,
    component
});
forbiddenRoute.path = Route._FORBIDDEN;
Route.forbidden = forbiddenRoute;
