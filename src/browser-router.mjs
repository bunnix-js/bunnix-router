import Bunnix from '@bunnix/core';
import { isDev } from './dev.mjs';
import { Route } from './route.mjs';

/**
 * Reactive state containing the current window location path.
 */
export const _routeState = Bunnix.State({ path: window.location.pathname });

/**
 * Global counter used to validate that a RouterRoot is present within a BrowserRouter.
 * @internal
 */
export let _routerRootCount = 0;

/**
 * Resets the router stack counter.
 * @internal
 */
export const resetRouterCount = () => _routerRootCount = 0;

/**
 * Increments the router stack counter.
 * @internal
 */
export const incrementRouterCount = () => _routerRootCount++;

// Convenience getter for current route state
Object.defineProperty(_routeState, 'current', {
    get: () => _routeState.get()
});

// Listen for browser back/forward navigation
window.addEventListener('popstate', () => {
    _routeState.set({ path: window.location.pathname });
});

/**
 * Internal tracker for pushes to the history stack.
 * Used by the back() function to determine if it should navigate back or to a fallback.
 */
let _internalHistoryCount = 0;

/**
 * Programmatically updates the browser URL and triggers a route update.
 * 
 * @param {string} path - The target path to navigate to.
 * @param {Object} [options={}] - Navigation options.
 * @param {boolean} [options.replace=false] - If true, replaces the current history entry instead of pushing a new one.
 */
export const navigate = (path, options = {}) => {
    const resolvedPath = (path && typeof path === 'object' && typeof path.path === 'string')
        ? path.path
        : (typeof path === 'function' && typeof path.path === 'string')
            ? path.path
            : path;

    if (typeof resolvedPath !== 'string') return;

    if (resolvedPath === Route._NOT_FOUND || resolvedPath === Route._FORBIDDEN) {
        _routeState.set({ path: resolvedPath });
        return;
    }

    if (window.location.pathname !== resolvedPath) {
        if (options.replace) {
            window.history.replaceState({}, '', resolvedPath);
        } else {
            window.history.pushState({}, '', resolvedPath);
            _internalHistoryCount++;
        }
        _routeState.set({ path: resolvedPath });
    }
};

/**
 * Navigates back in history if possible, otherwise navigates to a fallback path.
 * 
 * @param {string} [fallback='/'] - The path to navigate to if no internal history exists.
 */
export const back = (fallback = '/') => {
    const resolvedFallback = (fallback && typeof fallback === 'object' && typeof fallback.path === 'string')
        ? fallback.path
        : (typeof fallback === 'function' && typeof fallback.path === 'string')
            ? fallback.path
            : fallback;

    if (_internalHistoryCount > 0) {
        _internalHistoryCount--;
        window.history.back();
    } else {
        navigate(resolvedFallback, { replace: true });
    }
};

/**
 * Root router component that provides navigation context to the application.
 * Validates that at least one RouterRoot is rendered within its tree.
 * 
 * @param {Object|Function} props - Props or direct child when called as function.
 * @param {Array} [children] - Children when used as a JSX component.
 * @returns {DOMNode} The rendered content.
 */
export const BrowserRouter = (props, children) => {
    resetRouterCount();

    let content = props?.children ?? (children && children.length ? children : props);
    if (Array.isArray(content)) {
        content = content.length === 1 ? content[0] : Bunnix('div', {}, content);
    }
    const resolved = typeof content === 'function' ? Bunnix(content) : content;

    Bunnix.whenReady(() => {
        if (_routerRootCount === 0 && isDev()) {
            console.error("Bunnix.BrowserRouter: No RouterRoot found inside the Router tree. Please add a RouterRoot.");
        }
    });

    return resolved;
};
