import assert from 'node:assert/strict';
import { test } from 'node:test';
import Bunnix from '@bunnix/core';
import { BrowserRouter, RouterRoot, RouteGroup, RoutePolicy, useRouterContext } from '../../index.mjs';

test('RouterRoot.Context merges defaults and app context', () => {
    const context = RouterRoot.Context({ user: 'ada' });

    assert.equal(context.user, 'ada');
    assert.equal(typeof context.cookies.get, 'function');
    assert.equal(typeof context.cookies.set, 'function');
    assert.equal(typeof context.cookies.remove, 'function');

    context.set('role', 'admin');
    assert.equal(context.role, 'admin');

    context.remove('user');
    assert.equal(context.user, undefined);
});

test('useRouterContext returns a router context', () => {
    const context = useRouterContext({ user: 'ada' });

    assert.equal(context.user, 'ada');
    assert.equal(typeof context.cookies.get, 'function');
});

test('RouterRoot.Context cookies support get/set/remove', () => {
    const context = RouterRoot.Context();

    context.cookies.set('token', 'abc');
    assert.equal(context.cookies.get('token'), 'abc');

    context.cookies.remove('token');
    assert.equal(context.cookies.get('token'), null);
});

test('RoutePolicy receives context and cookies', () => {
    window.history.replaceState({}, '', '/');
    window.dispatchEvent(new window.PopStateEvent('popstate'));

    const container = document.createElement('div');

    const policy = RoutePolicy(({ context }) => {
        context.set('policyRan', true);
        context.cookies.set('token', 'abc');
    });

    const Home = ({ context }) => (
        Bunnix('div', {}, `${context.policyRan}-${context.cookies.get('token')}`)
    );

    const App = () => RouterRoot(
        RouteGroup.root(Home, [policy])
    );

    Bunnix.render(
        Bunnix(BrowserRouter, {}, Bunnix(App)),
        container
    );

    assert.equal(container.textContent, 'true-abc');
});
