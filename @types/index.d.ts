/**
 * Navigation object injected into components and layouts.
 */
export interface Navigation {
    /** Navigates to a new path. */
    push(path: string | RouteDefinition | RouteSpecial): void;
    /** Replaces current history entry. */
    replace(path: string | RouteDefinition | RouteSpecial): void;
    /** Navigates back or to fallback. */
    back(fallback?: string | RouteDefinition | RouteSpecial): void;
    /** Current resolved path. */
    path: string;
    /** Current route params. */
    params: Record<string, string>;
    /** Group navigation info. */
    group: {
        rootPath: string;
    };
    /** Reactive state containing the current path string. */
    currentPath: any;
    /** The base path of the current navigation stack. */
    rootPath: string;
}

/**
 * Route rule builder.
 */
/**
 * Fluent API for defining routes.
 */
export interface RouteDefinition {
    type: 'Route';
    kind: 'normal' | 'notFound' | 'forbidden';
    path: string;
    component?: any;
    render?: any;
}

export interface RouteSpecial {
    (component: any): RouteDefinition;
    path: string;
}

export const Route: {
    (path: string, component?: any): RouteDefinition;
    (props: RouteProps, children?: any[]): RouteDefinition;
    root(component?: any): RouteDefinition;
    /** Define a fallback rule. */
    notFound: RouteSpecial;
    /** Define a forbidden rule. */
    forbidden: RouteSpecial;
    _NOT_FOUND: string;
    _FORBIDDEN: string;
};

export interface RoutePolicyDefinition {
    type: 'RoutePolicy';
    handler: (params: { context: any; navigation: Navigation }) => void;
}

export type RoutePolicyHandler = (params: { context: any; navigation: Navigation }) => void;
export type RoutePolicyLike = RoutePolicyDefinition | RoutePolicyHandler;

export interface RouteGroupDefinition {
    type: 'RouteGroup';
    rootPath: string;
    routes: RouteDefinition[];
    policies: RoutePolicyLike[];
    layout?: (props: {
        routerOutlet: () => any;
        navigation: Navigation;
        context?: any;
        [key: string]: any;
    }) => any;
    component?: any;
    isRoot?: boolean;
}

export interface RouterRootProps {
    context?: any;
    children?: any;
}

export interface RouteGroupProps {
    root?: boolean;
    rootPath?: string;
    layout?: (props: any) => any;
    policies?: RoutePolicyLike[];
    component?: any;
    children?: any;
}

export interface RouteProps {
    path?: string;
    component?: any;
    root?: boolean;
    notFound?: boolean;
    forbidden?: boolean;
}

export interface RoutePolicyProps {
    handler: RoutePolicyHandler;
}

export function BrowserRouter(child: any): any;
export function BrowserRouter(props: { children?: any }, children?: any[]): any;
export function RouterRoot(
    root: RouteDefinition | RouteGroupDefinition,
    routes?: RouteDefinition | RouteGroupDefinition | Array<RouteDefinition | RouteGroupDefinition>
): any;
export function RouterRoot(
    context: any,
    root: RouteDefinition | RouteGroupDefinition,
    routes?: RouteDefinition | RouteGroupDefinition | Array<RouteDefinition | RouteGroupDefinition>
): any;
export function RouterRoot(props: RouterRootProps, children?: any[]): any;
export namespace RouterRoot {
    function Context(appContext?: any): any;
}
export function useRouterContext(appContext?: any): any;
export function RouteGroup(
    rootPath: string,
    routesOrComponent: RouteDefinition[] | any,
    policiesOrLayout?: RoutePolicyLike[] | ((props: any) => any),
    layout?: (props: any) => any
): RouteGroupDefinition;
export function RouteGroup(props: RouteGroupProps, children?: any[]): RouteGroupDefinition;
export namespace RouteGroup {
    function root(
        routesOrComponent: RouteDefinition[] | any,
        policiesOrLayout?: RoutePolicyLike[] | ((props: any) => any),
        layout?: (props: any) => any
    ): RouteGroupDefinition;
}
export function RoutePolicy(handler: RoutePolicyHandler): RoutePolicyDefinition;
export function RoutePolicy(props: RoutePolicyProps, children?: any[]): RoutePolicyDefinition;

export interface LinkProps {
    to: string;
    navigation?: Navigation;
    [key: string]: any;
}

export function Link(props: LinkProps, children: any): any;
export function Link(props: LinkProps): any;

export const BunnixRouter: {
    BrowserRouter: typeof BrowserRouter;
    RouterRoot: typeof RouterRoot;
    RouteGroup: typeof RouteGroup;
    RoutePolicy: typeof RoutePolicy;
    Route: typeof Route;
    Link: typeof Link;
    useRouterContext: typeof useRouterContext;
};

export const Router: typeof BunnixRouter;

export default BunnixRouter;
