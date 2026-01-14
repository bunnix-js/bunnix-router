---
layout: default
title: Navigation
---

# Navigation

Matched components and layouts receive a scoped `navigation` object.

## Navigation API

- `navigation.push(path)`
- `navigation.replace(path)`
- `navigation.back(fallback?)`
- `navigation.path`
- `navigation.params`
- `navigation.group.rootPath`

## Using navigation in a Component

```javascript
function Home({ navigation }) {
    return Bunnix('div', [
        Bunnix('h1', 'Home'),
        Bunnix('button', { click: () => navigation.push('/profile') }, 'Profile')
    ]);
}
```

## Declarative Links

```javascript
import { Link } from '@bunnix/router';

const Nav = ({ navigation }) => (
    Bunnix('nav', [
        Link({ to: '/', navigation }, 'Home'),
        Link({ to: '/profile', navigation }, 'Profile')
    ])
);
```

## Redirects in Policies

Use `RoutePolicy` to perform redirects before rendering.

## Group History

`navigation.back()` uses group-scoped history in the new router. If there is no
history for the current group, it falls back to the group's root path (or the
explicit fallback you pass in).
