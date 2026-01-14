import Bunnix from '@bunnix/core';
import { bunnixToDOM } from '@bunnix/core/internal';
import { isDev } from './dev.mjs';
import { _routeState, incrementRouterCount, navigate, back } from './browser-router.mjs';
import { Route } from './route.mjs';
import { RouteGroup } from './route-group.mjs';
import { createRouterContext, isRouterContext } from './router-context.mjs';
import { isVdomNode, normalizeJsxChildren } from './jsx-helpers.mjs';

const isRouteLike = (value) => value && typeof value === 'object' && value.type === 'Route';
const isGroupLike = (value) => value && typeof value === 'object' && value.type === 'RouteGroup';
const isPolicyLike = (value) => value && typeof value === 'object' && value.type === 'RoutePolicy';

const normalizeList = (value) => {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
};

const isJsxInvocation = (args) => (
    args.length === 2
    && Array.isArray(args[1])
    && !isRouteLike(args[0])
    && !isGroupLike(args[0])
);

const resolveJsxNode = (child) => {
    if (isVdomNode(child)) {
        if (typeof child.tag !== 'function') {
            throw new Error('RouterRoot children must be Route or RouteGroup components.');
        }
        return child.tag(child.props, child.children);
    }
    return child;
};

const normalizeJsxDefinitions = (children) => (
    normalizeJsxChildren(children).map(resolveJsxNode)
);

const parseRouterRootJsx = (props = {}, children = []) => {
    const context = props.context ?? null;
    const definitions = normalizeJsxDefinitions(children);
    const invalid = definitions.filter((entry) => (
        entry !== null
        && entry !== undefined
        && !isGroupLike(entry)
        && !isRouteLike(entry)
        && !isPolicyLike(entry)
    ));
    const groups = definitions.filter(isGroupLike);
    const routes = definitions.filter(isRouteLike);
    const policies = definitions.filter(isPolicyLike);

    if (invalid.length > 0) {
        throw new Error('RouterRoot children must be Route or RouteGroup components.');
    }

    if (policies.length > 0) {
        throw new Error('RoutePolicy cannot be a direct child of RouterRoot.');
    }

    const rootGroups = groups.filter((group) => group.isRoot);
    const rootRoutes = routes.filter((route) => route.path === '/');
    const rootDefs = [...rootGroups, ...rootRoutes];

    if (rootDefs.length !== 1) {
        throw new Error('RouterRoot requires exactly one root RouteGroup or Route.');
    }

    const rootDef = rootDefs[0];
    const extraDefs = definitions.filter((entry) => entry !== rootDef);

    return { context, rootDef, extraDefs };
};

const matchPath = (pattern, path) => {
    const patternSegments = pattern.split('/').filter(Boolean);
    const pathSegments = path.split('/').filter(Boolean);

    if (patternSegments.length !== pathSegments.length) {
        return { matches: false, params: {} };
    }

    const params = {};
    const matches = patternSegments.every((seg, i) => {
        if (seg.startsWith(':')) {
            const paramName = seg.slice(1);
            params[paramName] = pathSegments[i];
            return true;
        }
        return seg === pathSegments[i];
    });

    return { matches, params };
};

const normalizeGroup = (group, isRoot = false) => {
    const routes = Array.isArray(group.routes) ? [...group.routes] : [];
    if (group.component) {
        routes.unshift(Route(group.rootPath, group.component));
    }
    return {
        type: 'RouteGroup',
        rootPath: group.rootPath || '/',
        routes,
        policies: group.policies || [],
        layout: group.layout || null,
        isRoot
    };
};

const createRootGroupFromRoute = (route) => normalizeGroup({
    rootPath: route.path || '/',
    routes: [route],
    policies: [],
    layout: null,
    component: null
}, true);

export const RouterRoot = (...args) => {
    let context = null;
    let rootDef = args[0];
    let extraDefs = args[1];

    if (isJsxInvocation(args)) {
        const parsed = parseRouterRootJsx(args[0], args[1]);
        context = parsed.context;
        rootDef = parsed.rootDef;
        extraDefs = parsed.extraDefs;
    }

    if (args.length > 1 && rootDef && !isRouteLike(rootDef) && !isGroupLike(rootDef)) {
        context = rootDef;
        rootDef = args[1];
        extraDefs = args[2];
    }

    let contextValue = context;
    const resolvedContext = isRouterContext(contextValue)
        ? contextValue
        : createRouterContext(contextValue ?? {});
    const useGroupHistory = true;
    const entries = [];
    const specialRoutes = { notFound: null };

    if (isGroupLike(rootDef)) {
        entries.push({ type: 'group', group: normalizeGroup(rootDef, true) });
    } else if (isRouteLike(rootDef)) {
        entries.push({ type: 'group', group: createRootGroupFromRoute(rootDef) });
    } else {
        throw new Error('RouterRoot requires a root Route or RouteGroup.');
    }

    for (const entry of normalizeList(extraDefs)) {
        if (isGroupLike(entry)) {
            entries.push({ type: 'group', group: normalizeGroup(entry) });
        } else if (isRouteLike(entry)) {
            entries.push({ type: 'route', route: entry });
        }
    }

    // Extract special routes and strip them from matching lists.
    for (const entry of entries) {
        if (entry.type === 'group') {
            entry.group.routes = entry.group.routes.filter((route) => {
                const isNotFound = route.kind === 'notFound' || route.path === Route._NOT_FOUND;
                if (isNotFound && !specialRoutes.notFound) {
                    specialRoutes.notFound = route;
                    return false;
                }
                return true;
            });
        }
    }

    if (!specialRoutes.notFound) {
        const explicitNotFound = entries.find((entry) => (
            entry.type === 'route'
            && (entry.route.kind === 'notFound' || entry.route.path === Route._NOT_FOUND)
        ));
        if (explicitNotFound) specialRoutes.notFound = explicitNotFound.route;
    }

    const forbiddenRouteDef = entries.find((entry) => (
        entry.type === 'route'
        && (entry.route.kind === 'forbidden' || entry.route.path === Route._FORBIDDEN)
    ))?.route ?? null;

    incrementRouterCount();

    const matchedParams = Bunnix.useState({});
    const groupRootPath = Bunnix.useState(entries[0]?.group?.rootPath || '/');

    const rootStart = document.createComment('bunnix-router-root:start');
    const rootEnd = document.createComment('bunnix-router-root:end');
    const rootFragment = document.createDocumentFragment();
    rootFragment.append(rootStart, rootEnd);

    let outletStart = rootStart;
    let outletEnd = rootEnd;
    let pendingVdom = null;
    let renderVersion = 0;
    let activeGroup = null;

    const groupHistory = new Map();

    const recordHistory = (groupKey, path) => {
        if (!groupKey || !path) return;
        const history = groupHistory.get(groupKey) ?? [];
        if (history[history.length - 1] !== path) {
            history.push(path);
            groupHistory.set(groupKey, history);
        }
    };

    const resolvePath = (path) => {
        if (path && typeof path === 'object' && typeof path.path === 'string') return path.path;
        if (typeof path === 'function' && typeof path.path === 'string') return path.path;
        return path;
    };

    let forcedPath = null;
    let forcedRoute = null;

    let applyMatch = null;
    let suppressHistoryRecord = false;

    const navigation = {
        push: (path) => {
            const resolvedPath = resolvePath(path);
            if (useGroupHistory && navigation.path && navigation.path !== resolvedPath) {
                recordHistory(navigation.group.rootPath, navigation.path);
            }
            navigate(resolvedPath);
        },
        replace: (path) => {
            const resolvedPath = resolvePath(path);
            if (resolvedPath === navigation.path) {
                return;
            }
            if ((path === Route.forbidden || resolvedPath === Route._FORBIDDEN) && forbiddenRouteDef) {
                forcedRoute = forbiddenRouteDef;
            }
            if (typeof resolvedPath === 'string' && resolvedPath.includes(Route._FORBIDDEN)) {
                forcedPath = resolvedPath;
            }
            navigate(resolvedPath, { replace: true });
            if (typeof resolvedPath === 'string' && resolvedPath.includes(Route._FORBIDDEN)) {
                queueMicrotask(() => applyMatch && applyMatch());
            }
            if ((path === Route.forbidden || resolvedPath === Route._FORBIDDEN) && forbiddenRouteDef) {
                const params = {};
                navigation.path = Route._FORBIDDEN;
                navigation.params = params;
                navigation.group.rootPath = entries[0]?.group?.rootPath || '/';
                matchedParams.set(params);
                groupRootPath.set(navigation.group.rootPath);
                if (activeGroup !== null) {
                    activeGroup = null;
                    setLayout(null, params);
                }
                renderVersion += 1;
                const content = forbiddenRouteDef.component ?? forbiddenRouteDef.render ?? null;
                pendingVdom = typeof content === 'function'
                    ? Bunnix(content, { navigation, context: resolvedContext })
                    : content;
                flushPending(false, renderVersion);
            }
        },
        back: (fallback = navigation.group.rootPath) => {
            if (!useGroupHistory) {
                back(fallback);
                return;
            }
            const history = groupHistory.get(navigation.group.rootPath) ?? [];
            if (history.length > 0) {
                const previous = history.pop();
                groupHistory.set(navigation.group.rootPath, history);
                suppressHistoryRecord = true;
                navigate(previous, { replace: true });
            } else {
                navigate(fallback, { replace: true });
            }
        },
        currentPath: _routeState.map(r => r.path),
        rootPath: entries[0]?.group?.rootPath || '/',
        group: {
            rootPath: groupRootPath.get()
        },
        path: _routeState.get().path,
        params: matchedParams.get()
    };

    const removeBetween = (startNode, endNode) => {
        let node = startNode.nextSibling;
        while (node && node !== endNode) {
            const next = node.nextSibling;
            node.remove();
            node = next;
        }
    };

    const setLayout = (layout, params) => {
        if (!rootStart.parentNode) {
            Bunnix.whenReady(() => setLayout(layout, params));
            return;
        }
        if (!layout) {
            outletStart = rootStart;
            outletEnd = rootEnd;
            removeBetween(rootStart, rootEnd);
            return;
        }

        const outletFragment = document.createDocumentFragment();
        outletStart = document.createComment('bunnix-router-root:outlet-start');
        outletEnd = document.createComment('bunnix-router-root:outlet-end');
        outletFragment.append(outletStart, outletEnd);

        const routerOutlet = () => outletFragment;
        const layoutVdom = Bunnix(layout, { routerOutlet, navigation, context: resolvedContext, ...params });
        const layoutDom = bunnixToDOM(layoutVdom);

        removeBetween(rootStart, rootEnd);
        rootStart.parentNode.insertBefore(layoutDom, rootEnd);
    };

    const flushPending = (clear = false, version = renderVersion) => {
        if (!rootStart.parentNode) {
            Bunnix.whenReady(() => flushPending(clear, version));
            return;
        }
        if (version !== renderVersion) return;
        if (!pendingVdom) {
            if (clear) removeBetween(outletStart, outletEnd);
            return;
        }
        const dom = bunnixToDOM(pendingVdom);
        if (version !== renderVersion) {
            if (isDev()) {
                console.warn('[DEV] Bunnix.Show: render superseded by a newer update (possible redirect inside useEffect).');
            }
            return;
        }
        removeBetween(outletStart, outletEnd);
        outletStart.parentNode.insertBefore(dom, outletEnd);
        pendingVdom = null;
    };

    const runPolicies = (policies, path) => {
        for (const policy of policies) {
            if (typeof policy === 'function') {
                policy({ context: resolvedContext, navigation });
            } else if (policy && typeof policy.handler === 'function') {
                policy.handler({ context: resolvedContext, navigation });
            }
            if (_routeState.get().path !== path) {
                return true;
            }
        }
        return false;
    };

    const resolveMatch = (path) => {
        const isNotFoundPath = path === Route._NOT_FOUND || path === `/${Route._NOT_FOUND}`;
        const isForbiddenPath = path === Route._FORBIDDEN
            || path === `/${Route._FORBIDDEN}`
            || (typeof path === 'string' && path.endsWith(`/${Route._FORBIDDEN}`))
            || (typeof path === 'string' && path.endsWith(Route._FORBIDDEN));

        if (isNotFoundPath) {
            if (specialRoutes.notFound) {
                return { route: specialRoutes.notFound, group: null, params: {} };
            }
            const fallbackNotFound = entries.find((entry) => entry.type === 'route' && entry.route.kind === 'notFound');
            if (fallbackNotFound) {
                return { route: fallbackNotFound.route, group: null, params: {} };
            }
        }

        for (const entry of entries) {
            if (entry.type === 'group') {
                for (const route of entry.group.routes) {
                    const result = matchPath(route.path, path);
                    if (result.matches) {
                        return { route, group: entry.group, params: result.params };
                    }
                }
            } else if (entry.type === 'route') {
                const result = matchPath(entry.route.path, path);
                if (result.matches) {
                    return { route: entry.route, group: null, params: result.params };
                }
            }
        }

        if (isForbiddenPath) {
            const fallbackForbidden = entries.find((entry) => (
                entry.type === 'route'
                && (entry.route.kind === 'forbidden' || entry.route.path === Route._FORBIDDEN)
            ));
            if (fallbackForbidden) {
                return { route: fallbackForbidden.route, group: null, params: {} };
            }
        }

        if (specialRoutes.notFound) {
            return { route: specialRoutes.notFound, group: null, params: {} };
        }

        return { route: null, group: null, params: {} };
    };

    applyMatch = () => {
        const previousPath = navigation.path;
        const previousGroupRoot = navigation.group.rootPath;
        const path = forcedRoute ? Route._FORBIDDEN : (forcedPath ?? _routeState.get().path);
        forcedPath = null;
        let { route, group, params } = forcedRoute
            ? { route: forcedRoute, group: null, params: {} }
            : resolveMatch(path);
        forcedRoute = null;

        if (!route && typeof path === 'string' && path.includes(Route._FORBIDDEN)) {
            const fallbackForbidden = entries.find((entry) => (
                entry.type === 'route'
                && (entry.route.kind === 'forbidden' || entry.route.path === Route._FORBIDDEN)
            ));
            if (fallbackForbidden) {
                route = fallbackForbidden.route;
                group = null;
                params = {};
            }
        }

        navigation.path = path;
        navigation.params = params;
        navigation.group.rootPath = group?.rootPath || entries[0]?.group?.rootPath || '/';

        if (!suppressHistoryRecord && useGroupHistory && previousPath && previousPath !== path) {
            recordHistory(previousGroupRoot || navigation.group.rootPath, previousPath);
        }
        suppressHistoryRecord = false;
        matchedParams.set(params);
        groupRootPath.set(navigation.group.rootPath);

        const rootPolicies = entries[0]?.group?.policies || [];
        if (runPolicies(rootPolicies, path)) return;

        if (group?.policies?.length) {
            if (runPolicies(group.policies, path)) return;
        }

        if (!route) {
            renderVersion += 1;
            pendingVdom = null;
            flushPending(true, renderVersion);
            return;
        }

        if (activeGroup !== group) {
            activeGroup = group;
            setLayout(group?.layout ?? null, params);
        }

        if (route.then) {
            queueMicrotask(() => route.then(navigation, params));
            return;
        }

        const content = route.component ?? route.render ?? null;
        renderVersion += 1;
        pendingVdom = typeof content === 'function'
            ? Bunnix(content, { ...params, navigation, context: resolvedContext })
            : content;
        flushPending(false, renderVersion);
    };

    Bunnix.whenReady(() => flushPending(false, renderVersion));

    Bunnix.useEffect(() => {
        applyMatch();
    }, [_routeState]);

    return rootFragment;
};

RouterRoot.Context = (appContext = {}) => createRouterContext(appContext);

export { RouteGroup, Route };
