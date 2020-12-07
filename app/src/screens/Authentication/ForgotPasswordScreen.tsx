import React, { useEffect, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { observer } from 'mobx-react-lite'
import { useForm, Controller } from 'react-hook-form'
import { useMutation } from '@apollo/client'
import { Button, Divider, Input, withStyles } from '@ui-kitten/components'
import { Screen, TopNav } from '../../components'
import { color, spacing } from '../../theme'
import { FORGOT_PASSWORD } from '../../data'
import type { forgotPassword } from '../../types/forgotPassword'
import type { NavigationProp, ParamListBase } from '@react-navigation/native'

const ForgotPasswordScreenRaw = observer((
  { eva, navigation }: {
    eva?: any
    navigation: NavigationProp<ParamListBase>
}) => {
  useEffect(() => {
    console.tron?.display({ name: 'Forgot password screen' })
  }, [])

  const { control, handleSubmit } = useForm()
  const [ email, setEmail ] = useState('')

  const [ onSubmit, { loading: isFormSubmitting } ] = useMutation<forgotPassword>(FORGOT_PASSWORD, {
    variables: {
      email,
    },
    fetchPolicy: 'no-cache',
  })

  // validation
  const isEmailValid = /^\w+([\.+-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/.test(email)
  const isFormValid = isEmailValid

  return (
    <View style={eva.style.MainView}>
      <TopNav
        title='Forgot password'
        onGoPreviousScreen={() => { navigation.navigate('Authentication') }}
        style={eva.style.TopNav}
      />
      <Screen style={eva.style.Container} preset='scroll' unsafe>
        <ScrollView style={eva.style.Form}>
          <Controller
            control={control}
            name='email'
            defaultValue={email}
            render={({ onChange, onBlur, value }) => (
              <Input
                autoCapitalize='none'
                autoCorrect={false}
                autoCompleteType='email'
                style={eva.style.Input}
                value={value}
                keyboardType='email-address'
                placeholder='Email address'
                textContentType='emailAddress'
                status={value && !isEmailValid && 'warning'}
                onBlur={onBlur}
                onChangeText={nextValue => {
                  setEmail(nextValue)
                  onChange(nextValue)
                }}
                returnKeyType='done'
                onSubmitEditing={handleSubmit(onSubmit)}
                blurOnSubmit={false}
                disabled={isFormSubmitting}
              />
            )}
          />
          <Divider style={{ height: 20, backgroundColor: color.transparent }} />
          <Button
            status='primary'
            onPress={handleSubmit(onSubmit)}
            disabled={!isFormValid}
          >
            SUBMIT
          </Button>
        </ScrollView>
      </Screen>
    </View>
  )
})

export const ForgotPasswordScreen = withStyles(ForgotPasswordScreenRaw, theme => ({
  MainView: {
    flex: 1,
    backgroundColor: color.transparent,
  },
  TopNav: {
    color: color.palette.black,
    backgroundColor: theme['color-basic-100'],
  },
  Container: {
    flex: 1,
  },
  Form: {
    backgroundColor: 'white',
    paddingVertical: 20,
    paddingHorizontal: spacing[6],
  },
}))
