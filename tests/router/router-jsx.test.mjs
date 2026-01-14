import assert from 'node:assert/strict';
import { test } from 'node:test';
import Bunnix from '@bunnix/core';
import { BrowserRouter, RouterRoot, RouteGroup, RoutePolicy, Route } from '../../index.mjs';

test('RouterRoot JSX renders root group and extra routes', () => {
    window.history.replaceState({}, '', '/about');
    window.dispatchEvent(new window.PopStateEvent('popstate'));

    const container = document.createElement('div');
    const Home = () => Bunnix('div', {}, 'Home');
    const About = () => Bunnix('div', {}, 'About');

    const App = () => Bunnix(RouterRoot, {}, [
        Bunnix(RouteGroup, { root: true }, [
            Bunnix(Route, { path: '/', component: Home })
        ]),
        Bunnix(Route, { path: '/about', component: About })
    ]);

    Bunnix.render(
        Bunnix(BrowserRouter, {}, Bunnix(App)),
        container
    );

    assert.equal(container.textContent, 'About');
});

test('RoutePolicy JSX redirects before rendering', async () => {
    window.history.replaceState({}, '', '/');
    window.dispatchEvent(new window.PopStateEvent('popstate'));

    const container = document.createElement('div');
    const Home = () => Bunnix('div', {}, 'Home');
    const About = () => Bunnix('div', {}, 'About');

    const App = () => Bunnix(RouterRoot, {}, [
        Bunnix(RouteGroup, { root: true }, [
            Bunnix(Route, { path: '/', component: Home }),
            Bunnix(Route, { path: '/about', component: About }),
            Bunnix(RoutePolicy, {
                handler: ({ navigation }) => {
                    if (navigation.path === '/') {
                        navigation.replace('/about');
                    }
                }
            })
        ])
    ]);

    Bunnix.render(
        Bunnix(BrowserRouter, {}, Bunnix(App)),
        container
    );

    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(container.textContent, 'About');
});

test('RouteGroup JSX supports component prop and policies prop', async () => {
    window.history.replaceState({}, '', '/account');
    window.dispatchEvent(new window.PopStateEvent('popstate'));

    const container = document.createElement('div');
    const Account = () => Bunnix('div', {}, 'Account');
    const calls = [];

    const App = () => Bunnix(RouterRoot, {}, [
        Bunnix(RouteGroup, { root: true }, [
            Bunnix(Route, { path: '/', component: () => Bunnix('div', {}, 'Root') })
        ]),
        Bunnix(RouteGroup, {
            rootPath: '/account',
            component: Account,
            policies: [() => calls.push('policy')]
        })
    ]);

    Bunnix.render(
        Bunnix(BrowserRouter, {}, Bunnix(App)),
        container
    );

    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(container.textContent, 'Account');
    assert.equal(calls.length, 1);
});
