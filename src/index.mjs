import { BrowserRouter, _routeState } from './browser-router.mjs';
import { RouterRoot } from './router-root.mjs';
import { RouteGroup } from './route-group.mjs';
import { RoutePolicy } from './route-policy.mjs';
import { Route } from './route.mjs';
import { Link } from './link.mjs';

// Public API Exports
export const useRouterContext = RouterRoot.Context;
export { BrowserRouter, RouterRoot, RouteGroup, RoutePolicy, Route, Link };

export const BunnixRouter = {
    BrowserRouter,
    RouterRoot,
    RouteGroup,
    RoutePolicy,
    Route,
    Link,
    useRouterContext
};

const BunnixRouterProxy = new Proxy(BunnixRouter, {
    get(target, prop) {
        if (prop in target) return target[prop];
        if (typeof prop === 'string') {
            const aliases = {
                browserRouter: 'BrowserRouter',
                routerRoot: 'RouterRoot',
                routeGroup: 'RouteGroup',
                routePolicy: 'RoutePolicy',
                route: 'Route',
                link: 'Link',
                useRouterContext: 'useRouterContext',
                browser: 'BrowserRouter',
                root: 'RouterRoot',
                group: 'RouteGroup',
                policy: 'RoutePolicy'
            };
            if (aliases[prop]) return target[aliases[prop]];
        }
        return Reflect.get(target, prop);
    }
});

export { BunnixRouterProxy as Router };

export default BunnixRouterProxy;
