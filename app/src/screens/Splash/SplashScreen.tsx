import React, { useEffect, useState } from 'react'
import { Image, View } from 'react-native'
import { Screen } from '../../components'
import { Spinner, Text, withStyles } from '@ui-kitten/components'
import { observer } from 'mobx-react-lite'
import { useQuery } from '@apollo/client'
import { applicationId, nativeApplicationVersion, nativeBuildVersion } from 'expo-application'
import { color, spacing } from '../../theme'
import { useStores } from '../../models'
import { INITIALIZE } from '../../data'
import type { initialize } from '../../types/initialize'
import { captureException } from 'sentry-expo'

const logo = require('./logo.png')

const SplashScreenRaw = observer(({ eva, children }) => {
  const [appReady, setAppReady] = useState(false)
  const [percentage, setPercentage] = useState(0)

  useEffect(() => {
    console.tron?.display({ name: 'Splash screen' })
    setPercentage(10)
  }, [])

  const { me } = useStores()

  useQuery<initialize>(INITIALIZE, {
    onCompleted: async (data) => {
      setPercentage(30)
      console.tron?.display({ name: 'GQL INITIALIZE', value: { data, query: INITIALIZE } })
      await me.initialize(data.currentUser)
      setPercentage(80)
      setAppReady(true)
    },
    onError: (error) => {
      captureException(error)
      __DEV__ && console.tron?.error(error.message, null)
      // Alert.alert(error.message, GRAPHQL_API_ENDPOINT)
    },
  })

  if (appReady) {
    return children
  }

  return (
    <View style={eva.style.View}>
      <Screen style={eva.style.Container}>
        <View style={eva.style.LogoContainer}>
          <Image style={eva.style.Logo} source={logo} />
        </View>
        <Text style={eva.style.Text} category='h5'>Let's Do This</Text>
        <Spinner size='giant' />
        <Text category='label'>Loading… {percentage} %</Text>
        <Text category='p2' appearance='hint'>{`${applicationId} ${nativeApplicationVersion} ${nativeBuildVersion}`}</Text>
      </Screen>
    </View>
  )
})

export const SplashScreen = withStyles(SplashScreenRaw, theme => ({
  View: {
    flex: 1,
    backgroundColor: color.palette.white,
    borderTopWidth: 20,
    borderBottomWidth: 4,
    borderColor: theme['color-primary-default'],
  },
  Container: {
    justifyContent: 'space-evenly',
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'inherit',
    paddingHorizontal: spacing[4],
  },
  LogoContainer: {
    transform: [{ scale: 0.6 }],
  },
  Logo: {
    width: 290,
    height: 90,
  },
  Text: {
    color: theme['color-primary-default'],
    textAlign: 'center',
  },
}))
