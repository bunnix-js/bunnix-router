import assert from 'node:assert/strict';
import { test } from 'node:test';
import Bunnix from '@bunnix/core';
import { BrowserRouter, RouterRoot, RouteGroup, RoutePolicy, Route } from '../../index.mjs';

test('RouterRoot renders a root route', () => {
    window.history.replaceState({}, '', '/');
    window.dispatchEvent(new window.PopStateEvent('popstate'));

    const container = document.createElement('div');
    const Home = () => Bunnix('div', {}, 'Home');
    const App = () => RouterRoot(Route.root(Home));

    Bunnix.render(
        Bunnix(BrowserRouter, {}, Bunnix(App)),
        container
    );

    assert.equal(container.textContent, 'Home');
});

test('RouterRoot matches extra routes', () => {
    window.history.replaceState({}, '', '/about');
    window.dispatchEvent(new window.PopStateEvent('popstate'));

    const container = document.createElement('div');
    const Home = () => Bunnix('div', {}, 'Home');
    const About = () => Bunnix('div', {}, 'About');
    const App = () => RouterRoot(Route.root(Home), [
        Route('/about', About)
    ]);

    Bunnix.render(
        Bunnix(BrowserRouter, {}, Bunnix(App)),
        container
    );

    assert.equal(container.textContent, 'About');
});

test('RouterRoot accepts RouteGroup root with policies', () => {
    window.history.replaceState({}, '', '/');
    window.dispatchEvent(new window.PopStateEvent('popstate'));

    const container = document.createElement('div');
    const Home = () => Bunnix('div', {}, 'Home');
    const App = () => RouterRoot(
        RouteGroup.root(Home, [
            RoutePolicy(() => {})
        ])
    );

    Bunnix.render(
        Bunnix(BrowserRouter, {}, Bunnix(App)),
        container
    );

    assert.equal(container.textContent, 'Home');
});

test('RouterRoot navigates to Route.notFound', async () => {
    window.history.replaceState({}, '', '/');
    window.dispatchEvent(new window.PopStateEvent('popstate'));

    const container = document.createElement('div');
    const NotFound = () => Bunnix('div', {}, 'NF');
    const Guard = ({ navigation }) => {
        Bunnix.useEffect(() => {
            navigation.replace(Route.notFound);
        }, []);
        return Bunnix('div', {}, 'Guard');
    };

    const App = () => RouterRoot(
        Route.root(Guard),
        [Route.notFound(NotFound)]
    );

    Bunnix.render(
        Bunnix(BrowserRouter, {}, Bunnix(App)),
        container
    );

    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(container.textContent, 'NF');
});

test('RouterRoot navigates to Route.forbidden', async () => {
    window.history.replaceState({}, '', '/');
    window.dispatchEvent(new window.PopStateEvent('popstate'));

    const container = document.createElement('div');
    const Forbidden = () => Bunnix('div', {}, 'Forbidden');
    const App = () => RouterRoot(
        RouteGroup.root(
            () => Bunnix('div', {}, 'Root'),
            [
                RoutePolicy(({ navigation }) => {
                    navigation.replace(Route.forbidden);
                })
            ]
        ),
        [Route.forbidden(Forbidden)]
    );

    Bunnix.render(
        Bunnix(BrowserRouter, {}, Bunnix(App)),
        container
    );

    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(container.textContent, 'Forbidden');
});
