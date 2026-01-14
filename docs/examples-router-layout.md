---
layout: default
title: Example - Router Layout
---

# Example - Router Layout

A small app with a layout, scoped navigation, and dynamic params.

```javascript
import Bunnix from '@bunnix/core';
import { BrowserRouter, RouterRoot, RouteGroup, Route, Link } from '@bunnix/router';

const Home = () => Bunnix('h1', 'Home');

const User = ({ navigation }) => (
    Bunnix('div', [
        Bunnix('h1', ['User ', navigation.params.id]),
        Bunnix('button', { click: () => navigation.back('/') }, 'Back')
    ])
);

function Layout({ routerOutlet, navigation }) {
    return Bunnix('div', { class: 'layout' }, [
        Bunnix('nav', [
            Link({ to: '/', navigation }, 'Home'),
            Link({ to: '/user/42', navigation }, 'User 42')
        ]),
        Bunnix('main', [routerOutlet()])
    ]);
}

const App = () => RouterRoot(
    RouteGroup.root(
        [
            Route('/', Home),
            Route('/user/:id', User)
        ],
        [],
        Layout
    ),
    [
        Route.notFound(() => Bunnix('h1', 'Not Found'))
    ]
);

Bunnix.render(
    Bunnix(BrowserRouter, {}, Bunnix(App)),
    document.getElementById('root')
);
```
