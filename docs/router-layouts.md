---
layout: default
title: Layouts
---

# Layouts

Layouts let you wrap routes with persistent UI such as headers or sidebars. Layout components receive `routerOutlet`, `navigation`, and any matched route params. Layouts are defined per `RouteGroup`, so each group can have its own wrapper.

## Layout Example

```javascript
import Bunnix from '@bunnix/core';
import { Link } from '@bunnix/router';

function AppLayout({ routerOutlet, navigation, accountId }) {
    return Bunnix('div', { class: 'layout' }, [
        Bunnix('header', ['Account: ', accountId]),
        Bunnix('nav', [
            Link({ to: '/', navigation }, 'Home'),
            Link({ to: '/settings', navigation }, 'Settings')
        ]),
        Bunnix('main', [
            routerOutlet()
        ])
    ]);
}
```

## Attach a Layout

```javascript
import { RouterRoot, RouteGroup, Route } from '@bunnix/router';

const App = () => (
    <RouterRoot>
        <RouteGroup rootPath="/dashboard" layout={DashboardLayout}>
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/dashboard/settings" component={Settings} />
        </RouteGroup>
    </RouterRoot>
);
```

With a layout, route content renders only where `routerOutlet()` is called.
