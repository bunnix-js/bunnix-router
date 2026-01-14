---
layout: default
title: Router Migration
---

# Router Migration Guide

The router system is now centered around `RouterRoot`, `RouteGroup`, and `RoutePolicy`.
This guide covers the current, recommended API.

## Basic Setup

```javascript
import Bunnix from '@bunnix/core';
import { BrowserRouter } from '@bunnix/router';
import App from './App.js';

Bunnix.render(
  Bunnix(BrowserRouter, {}, Bunnix(App)),
  document.getElementById('root')
);
```

## Defining Routes

```javascript
import { RouterRoot, RouteGroup, Route } from '@bunnix/router';

const App = () => RouterRoot(
  RouteGroup.root([
    Route('/', Home),
    Route('/account', Account)
  ]),
  [
    Route.notFound(NotFound)
  ]
);
```

## Policies

```javascript
import { RoutePolicy } from '@bunnix/router';

RouteGroup('/account', [
  Route('/account', Account)
], [
  RoutePolicy(({ context, navigation }) => {
    if (!context.user) navigation.replace('/login');
  })
]);
```

## Layouts with `routerOutlet`

```javascript
const App = () => RouterRoot(
  RouteGroup('/dashboard', [
    Route('/dashboard', Dashboard),
    Route('/dashboard/settings', Settings)
  ], [], DashboardLayout)
);
```

## Context and Cookies

```javascript
const appContext = RouterRoot.Context({
  user: null,
  permissions: []
});

const App = () => RouterRoot(appContext, Route.root(Home));
```

Context always provides:

- `context.cookies.get/set/remove`
- `context.set(key, value)`
- `context.remove(key)`

## Navigation

- `navigation.path`
- `navigation.params`
- `navigation.group.rootPath`

Special redirects:

```javascript
navigation.replace(Route.notFound);
navigation.replace(Route.forbidden);
```
