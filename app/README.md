# Swag app

Mobile app of the SWAG project

## Project structure

```py
.
├── app                     # App source files
│   ├── components       ◀  # - React Native functional components
│   ├── config              # - Per-env configuration files
│   ├── i18n                # - Internationalization files
│   ├── models              # - Models
│   ├── navigation          # - Navigation-specific items
│   ├── screens          ◀  # - All the screens
│   ├── services            # - Services
│   ├── theme               # - Global & reusable styling elements
│   ├── utils               # - Helpers
│   └── app.tsx          ◀  # - App main entry point
├── assets                  # Public static assets (images, fonts)
├── storybook               # Storybook global configuration
├── test                    # Test scenarios
├── App.ts               ◀  # App main entry point
├── package.json            # Node package reference
└── README.md
```

<details><summary>More details</summary><br>

### `./app` directory

The inside of the app directory looks similar to the following:

```py
app
│── components
│── i18n
├── models
├── navigation
├── screens
├── services
├── theme
├── utils
└── app.tsx
```

**components**
This is where your React components will live. Each component will have a directory containing the `.tsx` file, along with a story file, and optionally `.presets`, and `.props` files for larger components. The app will come with some commonly used components like Button.

**i18n**
This is where your translations will live if you are using `react-native-i18n`.

**models**
This is where your app's models will live. Each model has a directory which will contain the `mobx-state-tree` model file, test file, and any other supporting files like actions, types, etc.

**navigation**
This is where your `react-navigation` navigators will live.

**screens**
This is where your screen components will live. A screen is a React component which will take up the entire screen and be part of the navigation hierarchy. Each screen will have a directory containing the `.tsx` file, along with any assets or other helper files.

**services**
Any services that interface with the outside world will live here (think REST APIs, Push Notifications, etc.).

**theme**
Here lives the theme for your application, including spacing, colors, and typography.

**utils**
This is a great place to put miscellaneous helpers and utilities. Things like date helpers, formatters, etc. are often found here. However, it should only be used for things that are truely shared across your application. If a helper or utility is only used by a specific component or model, consider co-locating your helper with that component or model.

**app.tsx** This is the entry point to your app. This is where you will find the main App component which renders the rest of the application. This is also where you will specify whether you want to run the app in storybook mode.

### `./ignite` directory

The `ignite` directory stores all things Ignite, including CLI and boilerplate items. Here you will find generators, plugins and examples to help you get started with React Native.

### `./storybook` directory

This is where your stories will be registered and where the Storybook configs will live

### `./test` directory

This directory will hold your Jest configs and mocks, as well as your [storyshots](https://github.com/storybooks/storybook/tree/master/addons/storyshots) test file. This is a file that contains the snapshots of all your component storybooks.

</details>

## Getting started

1. Install dependencies:

    ```shell
    yarn install
    ```

2. Start the app:

   A. in web mode:

    ```shell
    yarn web
    ```

   B. in native mode:

    ```shell
    yarn start
    ```

## Running Storybook

From the command line in your generated app's root directory, enter `yarn run storybook`
This starts up the storybook server.

In `index.js`, change `SHOW_STORYBOOK` to `true` and reload the app.

For Visual Studio Code users, there is a handy extension that makes it easy to load Storybook use cases into a running emulator via tapping on items in the editor sidebar. Install the `React Native Storybook` extension by `Orta`, hit `cmd + shift + P` and select "Reconnect Storybook to VSCode". Expand the STORYBOOK section in the sidebar to see all use cases for components that have `.story.tsx` files in their directories.
