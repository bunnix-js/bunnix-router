import assert from 'node:assert/strict';
import { test } from 'node:test';
import Bunnix from '@bunnix/core';
import { BrowserRouter, RouterRoot, RouteGroup, Route } from '../../index.mjs';

test('layout local state reacts to navigation.path updates inside same group', async () => {
    window.history.replaceState({}, '', '/accounts');
    window.dispatchEvent(new window.PopStateEvent('popstate'));

    const container = document.createElement('div');
    const observedPaths = [];
    let routeNavigation;

    const Layout = ({ routerOutlet, navigation }) => {
        Bunnix.useEffect((value) => {
            observedPaths.push(value.path);
        }, navigation);

        return Bunnix('section', { id: 'accounts-layout' }, [routerOutlet()]);
    };

    const Accounts = ({ navigation }) => {
        routeNavigation = navigation;
        return Bunnix('div', { id: 'accounts-list' }, 'Accounts');
    };

    const AccountDetails = () => Bunnix('div', { id: 'account-details' }, 'Account Details');

    const App = () => RouterRoot(
        Route.root(() => Bunnix('div', {}, 'Root')),
        [
            RouteGroup('/accounts', [
                Route('/accounts', Accounts),
                Route('/accounts/:id', AccountDetails)
            ], [], Layout)
        ]
    );

    Bunnix.render(
        Bunnix(BrowserRouter, {}, Bunnix(App)),
        container
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    routeNavigation.push('/accounts/42');
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(container.querySelector('#account-details')?.textContent, 'Account Details');
    assert.ok(observedPaths.includes('/accounts'));
    assert.ok(observedPaths.includes('/accounts/42'));
});
