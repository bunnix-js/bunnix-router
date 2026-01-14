import assert from 'node:assert/strict';
import { test } from 'node:test';
import Bunnix from '@bunnix/core';
import { BrowserRouter, RouterRoot, RouteGroup, Route } from '../../index.mjs';

test('navigation.back navigates within the current group history', async () => {
    window.history.replaceState({}, '', '/group-one');
    window.dispatchEvent(new window.PopStateEvent('popstate'));

    const container = document.createElement('div');
    let navigation;

    const Home = ({ navigation: nav }) => {
        navigation = nav;
        return Bunnix('div', {}, 'Home');
    };
    const Details = () => Bunnix('div', {}, 'Details');

    const App = () => RouterRoot(
        Route.root(() => Bunnix('div', {}, 'Root')),
        [
            RouteGroup('/group-one', [
                Route('/group-one', Home),
                Route('/group-one/details', Details)
            ])
        ]
    );

    Bunnix.render(
        Bunnix(BrowserRouter, {}, Bunnix(App)),
        container
    );

    navigation.push('/group-one/details');
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(container.textContent, 'Details');

    navigation.back();
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(container.textContent, 'Home');
});

test('navigation.back pops history without re-adding the last route', async () => {
    window.history.replaceState({}, '', '/accounts');
    window.dispatchEvent(new window.PopStateEvent('popstate'));

    const container = document.createElement('div');
    let navigation;

    const Accounts = ({ navigation: nav }) => {
        navigation = nav;
        return Bunnix('div', {}, 'Accounts');
    };
    const Account = ({ navigation: nav }) => {
        navigation = nav;
        return Bunnix('div', {}, 'Account');
    };
    const Edit = ({ navigation: nav }) => {
        navigation = nav;
        return Bunnix('div', {}, 'Edit');
    };

    const App = () => RouterRoot(
        Route.root(() => Bunnix('div', {}, 'Root')),
        [
            RouteGroup('/accounts', [
                Route('/accounts', Accounts),
                Route('/account/:id', Account),
                Route('/account/edit/:id', Edit)
            ])
        ]
    );

    Bunnix.render(
        Bunnix(BrowserRouter, {}, Bunnix(App)),
        container
    );

    navigation.push('/account/1');
    await new Promise((resolve) => setTimeout(resolve, 0));
    navigation.push('/account/edit/1');
    await new Promise((resolve) => setTimeout(resolve, 0));

    navigation.back();
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(container.textContent, 'Account');

    navigation.back();
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(container.textContent, 'Accounts');
});

test('navigation.back falls back to group root when history is empty', async () => {
    window.history.replaceState({}, '', '/group-two/details');
    window.dispatchEvent(new window.PopStateEvent('popstate'));

    const container = document.createElement('div');

    const GroupRoot = () => Bunnix('div', {}, 'GroupRoot');
    const Details = ({ navigation }) => {
        Bunnix.useEffect(() => {
            navigation.back();
        }, []);
        return Bunnix('div', {}, 'Details');
    };

    const App = () => RouterRoot(
        Route.root(() => Bunnix('div', {}, 'Root')),
        [
            RouteGroup('/group-two', [
                Route('/group-two', GroupRoot),
                Route('/group-two/details', Details)
            ])
        ]
    );

    Bunnix.render(
        Bunnix(BrowserRouter, {}, Bunnix(App)),
        container
    );

    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(container.textContent, 'GroupRoot');
});

test('navigation.back uses explicit fallback when provided', async () => {
    window.history.replaceState({}, '', '/group-three/details');
    window.dispatchEvent(new window.PopStateEvent('popstate'));

    const container = document.createElement('div');

    const Fallback = () => Bunnix('div', {}, 'Fallback');
    const Details = ({ navigation }) => {
        Bunnix.useEffect(() => {
            navigation.back('/fallback');
        }, []);
        return Bunnix('div', {}, 'Details');
    };

    const App = () => RouterRoot(
        Route.root(() => Bunnix('div', {}, 'Root')),
        [
            Route('/fallback', Fallback),
            RouteGroup('/group-three', [
                Route('/group-three/details', Details)
            ])
        ]
    );

    Bunnix.render(
        Bunnix(BrowserRouter, {}, Bunnix(App)),
        container
    );

    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(container.textContent, 'Fallback');
});
