# [🥡 LOLstack](https://stack.lol)

**Your ready-to-dev & ready-to-deploy software stack.**

---

- A full-fledged stack with: web app, mobile app, API, database and more.
- That is ready-to-use, modern, typed, automated, full-stack, secure, scalable,
- Versatile, robust, performance-aware, no-dependencies, self-hosted
- And a tiny bit opinionated.

---

## 🚀 Getting started

1. Start the stack locally:

    ```shell
    docker-compose up
    ```

2. Access the services:

    - [🔀 Proxy](http://proxy-192-168-1-58-swag.on.stack.lol:8080/dashboard/#/http/routers)
      > This reverse proxy is the gateway to every services.
    <!--
    - [📱 App](http://app-local.swag.on.stack.lol)
      > The `expo-web`-enabled mobile app.
    -->
    - [💻 Back office 1](http://adminer-192-168-1-58-local-swag.on.stack.lol) + [💻 Back office 2](http://admin-192-168-1-58-local-swag.on.stack.lol)
      > A [pgweb](https://github.com/sosedoff/pgweb) dashboard, pre-configured, ready-to-use (read-only).<br>
      > An [Adminer](https://www.adminer.org) dashboard, pre-configured, ready-to-use (editable).
    - [☸️ GraphiQL](http://api-192-168-1-58-local-swag.on.stack.lol)
      > A GraphQL-enabled user interface for executing queries and mutations.
    - [☸️ GraphQL API](http://api-192-168-1-58-local-swag.on.stack.lol/graphql)
      > This is the actual GraphQL API endpoint for the project. Reacts only to the `POST` method.
    - [🔥 API REST](http://apirest-192-168-1-58-local-swag.on.stack.lol/docs/)
      > A RESTful API for the payment gateway & some authentication mechanisms
    - [📛 Status page](http://status-192-168-1-58-local-swag.on.stack.lol:8000/)
      > A status page system to communicate outage and downtime to customers
    - [📦 Database](postgres://swag:password@localhost:35432/swag?currentSchema=swag)
      > A PostgresQL database service.

3. Start the Expo app:

    ```shell
    (cd app && yarn start)
    ```

    Note: You can authenticate with this account:

    > Email: `user@example.com`<br>
    > Password: `password`
