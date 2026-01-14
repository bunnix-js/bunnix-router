import assert from 'node:assert/strict';
import { test } from 'node:test';
import Bunnix from '@bunnix/core';
import { BrowserRouter, RouterRoot, RouteGroup, RoutePolicy, Route } from '../../index.mjs';

test('Group policies can redirect based on context', async () => {
    window.history.replaceState({}, '', '/home');
    window.dispatchEvent(new window.PopStateEvent('popstate'));

    const container = document.createElement('div');
    const Home = () => Bunnix('div', {}, 'Home');
    const Login = () => Bunnix('div', {}, 'Login');

    const App = () => RouterRoot(
        Route.root(() => Bunnix('div', {}, 'Root')),
        [
            Route('/login', Login),
            RouteGroup('/home', [
                Route('/home', Home)
            ], [
                RoutePolicy(({ context, navigation }) => {
                    if (!context.user) navigation.replace('/login');
                })
            ])
        ]
    );

    Bunnix.render(
        Bunnix(BrowserRouter, {}, Bunnix(App)),
        container
    );

    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(container.textContent, 'Login');
});

test('Group policies can redirect to forbidden routes', async () => {
    window.history.replaceState({}, '', '/admin');
    window.dispatchEvent(new window.PopStateEvent('popstate'));

    const container = document.createElement('div');
    const Admin = () => Bunnix('div', {}, 'Admin');
    const Forbidden = () => Bunnix('div', {}, 'Forbidden');

    const App = () => RouterRoot(
        Route.root(() => Bunnix('div', {}, 'Root')),
        [
            RouteGroup('/admin', [
                Route('/admin', Admin)
            ], [
                RoutePolicy(({ navigation }) => {
                    navigation.replace(Route.forbidden);
                })
            ]),
            Route.forbidden(Forbidden)
        ]
    );

    Bunnix.render(
        Bunnix(BrowserRouter, {}, Bunnix(App)),
        container
    );

    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(container.textContent, 'Forbidden');
});

test('Groups render their own layouts and expose navigation state', async () => {
    window.history.replaceState({}, '', '/group-one/42');
    window.dispatchEvent(new window.PopStateEvent('popstate'));

    const container = document.createElement('div');
    let navigation;

    const LayoutOne = ({ routerOutlet }) => (
        Bunnix('section', { id: 'layout-one' }, ['One-', routerOutlet()])
    );
    const LayoutTwo = ({ routerOutlet }) => (
        Bunnix('section', { id: 'layout-two' }, ['Two-', routerOutlet()])
    );

    const GroupOne = ({ navigation: nav }) => {
        navigation = nav;
        return Bunnix('div', {}, `${nav.path}-${nav.params.id}-${nav.group.rootPath}`);
    };
    const GroupTwo = () => Bunnix('div', {}, 'GroupTwo');

    const App = () => RouterRoot(
        Route.root(() => Bunnix('div', {}, 'Root')),
        [
            RouteGroup('/group-one', [
                Route('/group-one/:id', GroupOne)
            ], [], LayoutOne),
            RouteGroup('/group-two', [
                Route('/group-two', GroupTwo)
            ], [], LayoutTwo)
        ]
    );

    Bunnix.render(
        Bunnix(BrowserRouter, {}, Bunnix(App)),
        container
    );

    assert.equal(container.textContent, 'One-/group-one/42-42-/group-one');
    assert.ok(container.querySelector('#layout-one'));

    navigation.push('/group-two');
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(container.textContent, 'Two-GroupTwo');
    assert.ok(container.querySelector('#layout-two'));
});
