import assert from 'node:assert/strict';
import { test } from 'node:test';
import Bunnix from '@bunnix/core';
import { BrowserRouter, RouterRoot, RouteGroup, RoutePolicy, Route } from '../../index.mjs';

test('RouterRoot renders the matched route', () => {
    window.history.replaceState({}, '', '/');
    window.dispatchEvent(new window.PopStateEvent('popstate'));

    const container = document.createElement('div');
    const App = () => RouterRoot(
        RouteGroup.root([
            Route('/', () => Bunnix('div', {}, 'Home')),
            Route.notFound(() => Bunnix('div', {}, 'NF'))
        ])
    );

    Bunnix.render(
        Bunnix(BrowserRouter, {}, Bunnix(App)),
        container
    );

    assert.equal(container.textContent, 'Home');
});

test('RouterRoot falls back to notFound when no route matches', () => {
    window.history.replaceState({}, '', '/missing');
    window.dispatchEvent(new window.PopStateEvent('popstate'));

    const container = document.createElement('div');
    const App = () => RouterRoot(
        RouteGroup.root([
            Route('/', () => Bunnix('div', {}, 'Home'))
        ]),
        [
            Route.notFound(() => Bunnix('div', {}, 'NF'))
        ]
    );

    Bunnix.render(
        Bunnix(BrowserRouter, {}, Bunnix(App)),
        container
    );

    assert.equal(container.textContent, 'NF');
});

test('RouterRoot layout renders once across route changes in same group', async () => {
    window.history.replaceState({}, '', '/');
    window.dispatchEvent(new window.PopStateEvent('popstate'));
    const container = document.createElement('div');

    let layoutRenderCount = 0;
    const layoutToken = `layout-${Math.random()}`;

    const Layout = ({ routerOutlet }) => {
        layoutRenderCount += 1;
        return Bunnix('div', { id: 'layout' }, [
            Bunnix('span', { id: 'layout-token' }, layoutToken),
            Bunnix('main', [routerOutlet()])
        ]);
    };

    let navigation;
    const Home = ({ navigation: nav }) => {
        navigation = nav;
        return Bunnix('div', {}, 'Home');
    };
    const About = () => Bunnix('div', {}, 'About');

    const App = () => RouterRoot(
        RouteGroup.root([
            Route('/', Home),
            Route('/about', About)
        ], [], Layout)
    );

    Bunnix.render(
        Bunnix(BrowserRouter, {}, Bunnix(App)),
        container
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    const tokenBefore = container.querySelector('#layout-token')?.textContent;
    assert.ok(navigation);
    assert.equal(container.textContent.includes('Home'), true);
    assert.equal(layoutRenderCount, 1);
    assert.equal(tokenBefore, layoutToken);

    navigation.push('/about');

    const tokenAfter = container.querySelector('#layout-token')?.textContent;
    assert.equal(container.textContent.includes('About'), true);
    assert.equal(layoutRenderCount, 1);
    assert.equal(tokenAfter, layoutToken);
});

test('RouterRoot does not keep list view when linking to detail route', async () => {
    window.history.replaceState({}, '', '/expenses/10');
    window.dispatchEvent(new window.PopStateEvent('popstate'));

    const container = document.createElement('div');

    const ExpensesByAccount = ({ navigation }) => (
        Bunnix('div', { id: 'expense-list' }, [
            Bunnix('a', {
                href: '/expense/10/99',
                click: (event) => {
                    event.preventDefault();
                    navigation.push('/expense/10/99');
                }
            }, 'Go to expense')
        ])
    );
    const ExpenseDetails = () => Bunnix('div', { id: 'expense-detail' }, 'Expense Details');

    const App = () => RouterRoot(
        RouteGroup.root([
            Route('/expenses/:accountId', ExpensesByAccount),
            Route('/expense/:accountId/:expenseId', ExpenseDetails)
        ])
    );

    Bunnix.render(
        Bunnix(BrowserRouter, {}, Bunnix(App)),
        container
    );

    assert.equal(container.querySelector('#expense-list')?.textContent, 'Go to expense');
    assert.equal(container.querySelector('#expense-detail'), null);

    const link = container.querySelector('a');
    assert.ok(link);
    link.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(container.querySelector('#expense-detail')?.textContent, 'Expense Details');
    assert.equal(container.querySelector('#expense-list'), null);
});

test('RouterRoot policies can trigger redirects', async () => {
    window.history.replaceState({}, '', '/account/42');
    window.dispatchEvent(new window.PopStateEvent('popstate'));

    const container = document.createElement('div');

    const Home = () => Bunnix('div', { id: 'home' }, 'Home');
    const Account = () => Bunnix('div', { id: 'account' }, 'Account');

    const App = () => RouterRoot(
        RouteGroup.root([
            Route('/home', Home),
            Route('/account/:id', Account)
        ], [
            RoutePolicy(({ navigation }) => {
                navigation.replace('/home');
            })
        ])
    );

    Bunnix.render(
        Bunnix(BrowserRouter, {}, Bunnix(App)),
        container
    );

    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(container.querySelector('#home')?.textContent, 'Home');
    assert.equal(container.querySelector('#account'), null);
});
