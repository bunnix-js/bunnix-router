---
layout: default
title: Router Overview
---

# Router Overview

Bunnix Router is decentralized and context-aware. Routes are defined with `RouterRoot` and scoped `RouteGroup`s using JSX wrappers or the function API.

## Router Pieces

- `BrowserRouter`: wraps your app and enables routing.
- `RouterRoot`: defines the root router tree.
- `RouteGroup`: groups routes with shared policies and layouts.
- `RoutePolicy`: guard/redirect logic for groups.
- `Route`: route definition helper (`<Route path="/path" component={Component} />`).
- `Link`: declarative navigation.

## Read Next

- [Routes](./router-routes.md)
- [Layouts](./router-layouts.md)
- [Navigation](./router-navigation.md)
