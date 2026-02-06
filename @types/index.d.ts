/**
 * Generic renderable value accepted by Bunnix components.
 */
export type Renderable = unknown;

/**
 * Dynamic params captured from route patterns like `/user/:id`.
 */
export type RouteParams = Record<string, string>;

/**
 * Minimal read-only state contract from `@bunnix/core`.
 */
export interface ReadonlyState<T> {
    get(): T;
    subscribe(cb: (value: T) => void): () => void;
    map<U>(fn: (value: T) => U): ReadonlyState<U>;
}

/**
 * Router cookie API available on context.
 */
export interface RouterCookies {
    get(key: string): string | null;
    set(key: string, value: unknown): void;
    remove(key: string): void;
}

/**
 * Router context shape injected into policies/components/layouts.
 */
export interface RouterContextBase {
    cookies: RouterCookies;
    set(key: string, value: unknown): void;
    remove(...keys: string[]): void;
    [key: string]: unknown;
}

/**
 * Typed router context enriched with app-specific keys.
 */
export type RouterContext<T extends Record<string, unknown> = Record<string, unknown>> =
    T & RouterContextBase;

/**
 * State value exposed by layout navigation state.
 */
export interface NavigationStateValue {
    path: string;
    params: RouteParams;
    currentGroup: string;
}

/**
 * Special route builder (e.g. `Route.notFound`, `Route.forbidden`).
 */
export interface RouteSpecial {
    (component: RouteComponent | Renderable): RouteDefinition;
    path: string;
}

/**
 * Acceptable navigation target values.
 */
export type PathTarget = string | Pick<RouteDefinition, 'path'> | RouteSpecial;

/**
 * Shared navigation actions.
 */
export interface NavigationActions {
    push(path: PathTarget): void;
    replace(path: PathTarget): void;
    back(fallback?: PathTarget): void;
    rootPath: string;
}

/**
 * Unwrapped navigation object injected into matched route components and policies.
 */
export interface Navigation extends NavigationActions, NavigationStateValue {}

/**
 * Reactive navigation state injected into layout components.
 */
export interface NavigationState extends NavigationActions, ReadonlyState<NavigationStateValue> {}

/**
 * Props injected into matched route components.
 */
export type RouteComponentProps<
    C extends RouterContext = RouterContext,
    P extends RouteParams = RouteParams
> = P & {
    navigation: Navigation;
    context: C;
    [key: string]: unknown;
};

/**
 * Route component function type.
 */
export type RouteComponent<
    C extends RouterContext = RouterContext,
    P extends RouteParams = RouteParams
> = (props: RouteComponentProps<C, P>) => Renderable;

/**
 * Props injected into layout components.
 */
export type LayoutProps<
    C extends RouterContext = RouterContext,
    P extends RouteParams = RouteParams
> = P & {
    routerOutlet: () => Renderable;
    navigation: NavigationState;
    context: C;
    [key: string]: unknown;
};

/**
 * Layout component function type.
 */
export type LayoutComponent<
    C extends RouterContext = RouterContext,
    P extends RouteParams = RouteParams
> = (props: LayoutProps<C, P>) => Renderable;

/**
 * Route definition object.
 */
export interface RouteDefinition<C extends RouterContext = RouterContext> {
    type: 'Route';
    kind: 'normal' | 'notFound' | 'forbidden';
    path: string;
    component?: RouteComponent<C> | Renderable;
    render?: RouteComponent<C> | Renderable;
}

/**
 * `Route` factory API.
 */
export interface RouteFactory {
    <C extends RouterContext = RouterContext>(
        path: string,
        component?: RouteComponent<C> | Renderable
    ): RouteDefinition<C>;
    <C extends RouterContext = RouterContext>(
        props: RouteProps<C>,
        children?: unknown[]
    ): RouteDefinition<C>;
    root<C extends RouterContext = RouterContext>(
        component?: RouteComponent<C> | Renderable
    ): RouteDefinition<C>;
    notFound: RouteSpecial;
    forbidden: RouteSpecial;
    _NOT_FOUND: string;
    _FORBIDDEN: string;
}

export const Route: RouteFactory;

/**
 * Route policy types.
 */
export interface RoutePolicyDefinition<C extends RouterContext = RouterContext> {
    type: 'RoutePolicy';
    handler: RoutePolicyHandler<C>;
}

export type RoutePolicyHandler<C extends RouterContext = RouterContext> = (params: {
    context: C;
    navigation: Navigation;
}) => void;

export type RoutePolicyLike<C extends RouterContext = RouterContext> =
    | RoutePolicyDefinition<C>
    | RoutePolicyHandler<C>;

/**
 * Route group definition.
 */
export interface RouteGroupDefinition<C extends RouterContext = RouterContext> {
    type: 'RouteGroup';
    rootPath: string;
    routes: RouteDefinition<C>[];
    policies: RoutePolicyLike<C>[];
    layout?: LayoutComponent<C> | null;
    component?: RouteComponent<C> | Renderable;
    isRoot?: boolean;
}

export type RouterTreeEntry<C extends RouterContext = RouterContext> =
    | RouteDefinition<C>
    | RouteGroupDefinition<C>;

export interface RouterRootProps<C extends RouterContext = RouterContext> {
    context?: C;
    children?: unknown;
}

export interface RouteGroupProps<C extends RouterContext = RouterContext> {
    root?: boolean;
    rootPath?: string;
    layout?: LayoutComponent<C> | null;
    policies?: RoutePolicyLike<C>[];
    component?: RouteComponent<C> | Renderable;
    children?: unknown;
}

export interface RouteProps<C extends RouterContext = RouterContext> {
    path?: string;
    component?: RouteComponent<C> | Renderable;
    root?: boolean;
    notFound?: boolean;
    forbidden?: boolean;
}

export interface RoutePolicyProps<C extends RouterContext = RouterContext> {
    handler: RoutePolicyHandler<C>;
}

export function BrowserRouter(child: unknown): unknown;
export function BrowserRouter(props: { children?: unknown }, children?: unknown[]): unknown;

export function RouterRoot<C extends RouterContext = RouterContext>(
    root: RouterTreeEntry<C>,
    routes?: RouterTreeEntry<C> | RouterTreeEntry<C>[]
): unknown;
export function RouterRoot<C extends RouterContext = RouterContext>(
    context: C,
    root: RouterTreeEntry<C>,
    routes?: RouterTreeEntry<C> | RouterTreeEntry<C>[]
): unknown;
export function RouterRoot<C extends RouterContext = RouterContext>(
    props: RouterRootProps<C>,
    children?: unknown[]
): unknown;

export namespace RouterRoot {
    function Context<T extends Record<string, unknown> = Record<string, unknown>>(
        appContext?: T
    ): RouterContext<T>;
}

export function useRouterContext<T extends Record<string, unknown> = Record<string, unknown>>(
    appContext?: T
): RouterContext<T>;

export function RouteGroup<C extends RouterContext = RouterContext>(
    rootPath: string,
    routesOrComponent: RouteDefinition<C>[] | RouteComponent<C> | Renderable,
    policiesOrLayout?: RoutePolicyLike<C>[] | LayoutComponent<C> | null,
    layout?: LayoutComponent<C> | null
): RouteGroupDefinition<C>;
export function RouteGroup<C extends RouterContext = RouterContext>(
    props: RouteGroupProps<C>,
    children?: unknown[]
): RouteGroupDefinition<C>;

export namespace RouteGroup {
    function root<C extends RouterContext = RouterContext>(
        routesOrComponent: RouteDefinition<C>[] | RouteComponent<C> | Renderable,
        policiesOrLayout?: RoutePolicyLike<C>[] | LayoutComponent<C> | null,
        layout?: LayoutComponent<C> | null
    ): RouteGroupDefinition<C>;
}

export function RoutePolicy<C extends RouterContext = RouterContext>(
    handler: RoutePolicyHandler<C>
): RoutePolicyDefinition<C>;
export function RoutePolicy<C extends RouterContext = RouterContext>(
    props: RoutePolicyProps<C>,
    children?: unknown[]
): RoutePolicyDefinition<C>;

export interface LinkNavigationLike {
    push(path: PathTarget): void;
}

export interface LinkProps {
    to: string;
    navigation?: LinkNavigationLike;
    [key: string]: unknown;
}

export function Link(props: LinkProps, children: unknown): unknown;
export function Link(props: LinkProps): unknown;

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
