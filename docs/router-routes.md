---
layout: default
title: Routes
---

# Routes

Define routes with `RouterRoot`, `RouteGroup`, and `Route`.

## Bootstrap

```javascript
import Bunnix from '@bunnix/core';
import { BrowserRouter } from '@bunnix/router';
import App from './App.js';

Bunnix.render(
    <BrowserRouter>
        <App />
    </BrowserRouter>,
    document.getElementById('root')
);
```

## Define Routes

```javascript
import Bunnix from '@bunnix/core';
import { RouterRoot, RouteGroup, Route } from '@bunnix/router';

const App = () => (
    <RouterRoot>
        <RouteGroup root>
            <Route path="/" component={Home} />
            <Route path="/user/:id" component={UserProfile} />
        </RouteGroup>
    </RouterRoot>
);
```

## Router Context Helper

```javascript
import { useRouterContext } from '@bunnix/router';

const appContext = useRouterContext({
    user: null,
    permissions: []
});
```

## Route Policies

Policies run before rendering and can redirect based on context.

```javascript
import { RouterRoot, RouteGroup, RoutePolicy, Route } from '@bunnix/router';

const App = () => (
    <RouterRoot>
        <RouteGroup rootPath="/account">
            <Route path="/account" component={Account} />
            <RoutePolicy handler={({ context, navigation }) => {
                if (!context.user) navigation.replace('/login');
            }} />
        </RouteGroup>
    </RouterRoot>
);
```

## Dynamic Params

`params` includes dynamic segments from the URL.

```javascript
function UserProfile({ params }) {
    return Bunnix('h1', ['User ', params.id]);
}
```
Params are available on `navigation.params`.

## Matching Rules

- Routes match by path segment count and order.
- `:param` segments capture values into `params`.
- The first matching rule wins.
- `Route.notFound` renders only when no other rule matches.
