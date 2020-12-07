import React, { useEffect } from 'react'
import { ScrollView, View } from 'react-native'
import { observer } from 'mobx-react-lite'
import { Divider, withStyles } from '@ui-kitten/components'
import { Screen, TopNav } from '../../components'
import { color, spacing } from '../../theme'
import { SignUpForm } from './SignUpForm'
import { SignInForm } from './SignInForm'
import { useStores } from '../../models'
import type { ApolloError } from '@apollo/client'
import type { NavigationProp, ParamListBase } from '@react-navigation/native'

const AuthenticationScreenRaw = observer((
  { eva, navigation }: {
    eva?: any
    navigation: NavigationProp<ParamListBase>
}) => {
  useEffect(() => {
    console.tron?.display({ name: 'Sign up screen' })
  }, [])

  const { me } = useStores()

  // const onSignUp = (data: getCurrentUser_currentUser) => {
  const onSignUp = (token: string) => {
    console.tron?.log(`AuthenticationScreenRaw onSignUp function called`, token)
    // me.update(data)
    me.authenticate(token)
  }

  const onSignIn = (token: string) => {
    // useStores.
    console.tron?.log(`AuthenticationScreenRaw onSignIn function called`, token)
    me.authenticate(token)
  }

  const onError = (error: ApolloError) => {
    // console.tron?.error('Error', error)
  }

  return (
    <View style={eva.style.MainView}>
      <TopNav
        title='Swag authentication'
        leftIcon='arrow-downward-outline'
        onGoPreviousScreen={() => { navigation.goBack() }}
        style={eva.style.TopNav}
      />
      <ScrollView style={eva.style.FormContainer}>
        <Screen style={eva.style.Form} preset='scroll' unsafe>
          <SignInForm {...{ eva, navigation }} onSuccess={onSignIn} onError={onError} />
          <Divider style={{ height: 30, backgroundColor: color.transparent }} />
          <Divider />
          <Divider style={{ height: 30, backgroundColor: color.transparent }} />
          <SignUpForm {...{ eva, navigation }} onSuccess={onSignUp} onError={onError} />
        </Screen>
      </ScrollView>
    </View>
  )
})

export const AuthenticationScreen = withStyles(AuthenticationScreenRaw, theme => ({
  MainView: {
    flex: 1,
    backgroundColor: color.transparent,
  },
  TopNav: {
    color: color.palette.black,
    backgroundColor: theme['color-basic-100'],
  },
  FormContainer: {
    backgroundColor: 'white',
    flex: 1,
  },
  Form: {
    paddingVertical: 20,
    paddingHorizontal: spacing[6],
  },
}))
