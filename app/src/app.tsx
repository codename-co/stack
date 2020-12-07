/**
 * Welcome to the main entry point of the app. In this file, we'll
 * be kicking off our app or storybook.
 *
 * Most of this file is boilerplate and you shouldn't need to modify
 * it very often. But take some time to look through and understand
 * what is going on here.
 *
 * The app navigation resides in ./app/navigation, so head over there
 * if you're interested in adding screens and navigators.
 */
import * as eva from '@eva-design/eva'
import { ApplicationProvider, IconRegistry } from '@ui-kitten/components'
import { EvaIconsPack } from '@ui-kitten/eva-icons'
import { default as theme } from './theme/ui-kitten-theme.json'
import './utils/ignore-warnings'
import React, { useEffect, useRef, useState } from "react"
import { NavigationContainerRef } from "@react-navigation/native"
import { SafeAreaProvider, initialWindowSafeAreaInsets } from "react-native-safe-area-context"
import { initFonts } from "./theme/fonts"
import * as storage from "./utils/storage"
import {
  useBackButtonHandler,
  RootNavigator,
  canExit,
  setRootNavigation,
  useNavigationPersistence,
} from "./navigation"
import { RootStore, RootStoreProvider, setupRootStore } from "./models"
import { ApolloProvider } from '@apollo/client'
import { apolloClient } from './utils/graphql'

// This puts screens in a native ViewController or Activity. If you want fully native
// stack navigation, use `createNativeStackNavigator` in place of `createStackNavigator`:
// https://github.com/kmagiera/react-native-screens#using-native-stack-navigator
import { enableScreens } from 'react-native-screens'
import { StatusBar } from 'expo-status-bar'
import { SplashScreen } from './screens'
import { typography } from './theme'
import { StatusBar as StatusBarRN } from 'react-native'

enableScreens()

const customMapping = {
  strict: {
    ['text-font-family']: typography.primary,
  },
}

const NAVIGATION_PERSISTENCE_KEY = 'NAVIGATION_STATE'

// storage.remove(JWT_TOKEN_PERSISTENCE_KEY)
// test expired token:
// storage.save('JWT', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYXBwX3VzZXIiLCJleHAiOjE2MDUxMDk3NjAsInBlcnNvbl9pZCI6MiwiaXNfYWRtaW4iOmZhbHNlLCJpc19zdXBwbGllciI6dHJ1ZSwiaXNfYnV5ZXIiOmZhbHNlLCJ1c2VybmFtZSI6InN1cHBsaWVyQGVuaWEuZ3JlZW4ifQ.6FCqcfca1urykBxPwXnaKNtuRI5HV00Ao-jRIIKt_28')

/**
 * This is the root component of our app.
 */
function App() {
  const navigationRef = useRef<NavigationContainerRef>()
  const [rootStore, setRootStore] = useState<RootStore | undefined>(undefined)

  setRootNavigation(navigationRef)
  useBackButtonHandler(navigationRef, canExit)
  const { initialNavigationState, onNavigationStateChange } = useNavigationPersistence(
    storage,
    NAVIGATION_PERSISTENCE_KEY,
  )

  // Kick off initial async loading actions, like loading fonts and RootStore
  useEffect(() => {
    (async () => {
      await initFonts()
      setupRootStore().then(rootStore => {
        setRootStore(rootStore)
      })
    })()
  }, [])

  // Before we show the app, we have to wait for our state to be ready.
  // In the meantime, don't render anything. This will be the background
  // color set in native by rootView's background color. You can replace
  // with your own loading component if you wish.
  if (!rootStore) return null

  // otherwise, we're ready to render the app
  return (
    <RootStoreProvider value={rootStore}>
      <ApolloProvider client={apolloClient}>
        <SafeAreaProvider initialSafeAreaInsets={initialWindowSafeAreaInsets}>
          <IconRegistry icons={EvaIconsPack} />
          <ApplicationProvider {...eva} theme={{ /*...eva.light, */...eva.light, ...theme }} customMapping={customMapping}>
            <StatusBar hidden={!(StatusBarRN.currentHeight > 0)} />
            <SplashScreen>
              <RootNavigator
                ref={navigationRef}
                initialState={initialNavigationState}
                onStateChange={onNavigationStateChange}
              />
            </SplashScreen>
          </ApplicationProvider>
        </SafeAreaProvider>
      </ApolloProvider>
    </RootStoreProvider>
  )
}

export default App
