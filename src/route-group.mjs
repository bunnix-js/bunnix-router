import { isVdomNode, normalizeJsxChildren } from './jsx-helpers.mjs';

const isPolicyLike = (value) => (
    typeof value === 'function'
    || (value && typeof value === 'object' && value.type === 'RoutePolicy')
);

const isRouteLike = (value) => value && typeof value === 'object' && value.type === 'Route';
const isGroupLike = (value) => value && typeof value === 'object' && value.type === 'RouteGroup';

const isJsxProps = (value) => (
    value
    && typeof value === 'object'
    && !Array.isArray(value)
    && value.type !== 'RouteGroup'
    && (
        Object.prototype.hasOwnProperty.call(value, 'root')
        || Object.prototype.hasOwnProperty.call(value, 'rootPath')
        || Object.prototype.hasOwnProperty.call(value, 'layout')
        || Object.prototype.hasOwnProperty.call(value, 'policies')
        || Object.prototype.hasOwnProperty.call(value, 'component')
    )
);

const resolveJsxNode = (child) => {
    if (isVdomNode(child)) {
        if (typeof child.tag !== 'function') {
            throw new Error('RouteGroup children must be Route or RoutePolicy components.');
        }
        return child.tag(child.props, child.children);
    }
    return child;
};

const createGroupFromJsx = (props = {}, children = []) => {
    const isRoot = !!props.root;
    const rootPath = isRoot ? '/' : props.rootPath;

    if (isRoot && props.rootPath) {
        throw new Error('RouteGroup cannot combine root and rootPath.');
    }
    if (!isRoot && !rootPath) {
        throw new Error('RouteGroup requires rootPath or root.');
    }

    const layout = props.layout ?? null;
    const component = props.component ?? null;
    const policiesFromProps = Array.isArray(props.policies) ? props.policies : [];

    const resolvedChildren = normalizeJsxChildren(children).map(resolveJsxNode);
    const routes = [];
    const policiesFromChildren = [];

    for (const child of resolvedChildren) {
        if (isRouteLike(child)) {
            routes.push(child);
            continue;
        }
        if (isPolicyLike(child)) {
            policiesFromChildren.push(child);
            continue;
        }
        if (isGroupLike(child)) {
            throw new Error('Nested RouteGroup components are not supported.');
        }
        if (child !== null && child !== undefined) {
            throw new Error('RouteGroup children must be Route or RoutePolicy components.');
        }
    }

    if (component && routes.length > 0) {
        throw new Error('RouteGroup cannot combine component with child routes.');
    }

    const policies = [...policiesFromProps, ...policiesFromChildren];

    return {
        type: 'RouteGroup',
        rootPath,
        routes,
        policies,
        layout,
        component,
        isRoot
    };
};

const normalizeGroupArgs = (rootPath, routesOrComponent, policiesOrLayout, maybeLayout, isRoot) => {
    const isRouteArray = Array.isArray(routesOrComponent);
    const policiesOnly = isRouteArray && routesOrComponent.length > 0
        && routesOrComponent.every(isPolicyLike);
    const routes = isRouteArray && !policiesOnly ? routesOrComponent : [];
    const component = !isRouteArray && routesOrComponent ? routesOrComponent : null;

    const policies = isRouteArray && policiesOnly
        ? routesOrComponent
        : Array.isArray(policiesOrLayout) ? policiesOrLayout : [];
    const layout = isRouteArray && policiesOnly
        ? (policiesOrLayout ?? null)
        : Array.isArray(policiesOrLayout)
            ? (maybeLayout ?? null)
            : (policiesOrLayout ?? null);

    return {
        type: 'RouteGroup',
        rootPath,
        routes,
        policies,
        layout,
        component,
        isRoot
    };
};

export const RouteGroup = (rootPath, routesOrComponent, policiesOrLayout = [], layout = null) => {
    if (isJsxProps(rootPath) && (routesOrComponent === undefined || Array.isArray(routesOrComponent))) {
        return createGroupFromJsx(rootPath, routesOrComponent ?? []);
    }
    return normalizeGroupArgs(rootPath, routesOrComponent, policiesOrLayout, layout, false);
};

RouteGroup.root = (routesOrComponent, policiesOrLayout = [], layout = null) => (
    normalizeGroupArgs('/', routesOrComponent, policiesOrLayout, layout, true)
);
