import React, { useRef, useState } from 'react'
import { TouchableWithoutFeedback, View } from 'react-native'
import type { NavigationProp, ParamListBase } from '@react-navigation/native'
import { observer } from 'mobx-react-lite'
import { useForm, Controller } from 'react-hook-form'
import { Button, Divider, Icon, Input, Text, withStyles } from '@ui-kitten/components'
import { useMutation } from '@apollo/client'
import SnackBar from 'react-native-snackbar-component'
import { AUTHENTICATE } from '../../data'
import { captureException } from 'sentry-expo'
import { color } from '../../theme'
import type { authenticate } from '../../types/authenticate'

const SignInFormRaw = observer(
  ({ eva, navigation, onSuccess, onError }: {
    eva?: any
    navigation: NavigationProp<ParamListBase>
    onSuccess?: (token: string) => void
    onError?: (ApolloError?) => void
  }) => {
  const { control, handleSubmit } = useForm()
  const [success, setSuccess] = useState<boolean>()
  const [isFormSubmitted, setIsFormSubmitted] = useState<boolean>()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [secureTextEntry, setSecureTextEntry] = React.useState(true)
  const passwordRef = useRef()

  const [ onSubmit, { loading: isFormSubmitting } ] = useMutation<authenticate>(AUTHENTICATE, {
    variables: {
      email,
      password,
    },
    fetchPolicy: 'no-cache',
    onCompleted: (data) => {
      console.tron?.display({ name: 'GQL AUTHENTICATE', value: { data, query: AUTHENTICATE } })
      console.log({ data })
      const token = data.authenticate.token
      const success = Boolean(token)

      setSuccess(success)
      setIsFormSubmitted(true)

      if (success) {
        onSuccess?.(token)
      } else {
        onError?.()
      }
    },
    onError: (error) => {
      // setSuccess(false)
      // setIsFormSubmitted(true)

      captureException(error)
      __DEV__ && console.tron?.error(error.message, null)
      onError?.(error)
    }
  })

  // validation
  const isEmailValid = /^\w+([\.+-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/.test(email)
  const isPasswordValid = password?.length >= 8
  const isFormValid = isEmailValid && isPasswordValid

  const toggleSecureEntry = () => {
    setSecureTextEntry(!secureTextEntry)
  }

  const renderIcon = (props) => (
    <TouchableWithoutFeedback onPress={toggleSecureEntry} disabled={isFormSubmitting}>
      <Icon {...props} name={secureTextEntry ? 'eye-off' : 'eye'} />
    </TouchableWithoutFeedback>
  )

  return (
    <View>
      <Text category='label' appearance='hint'>SIGN IN</Text>
      <Divider style={{ height: 10, backgroundColor: color.transparent }} />
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
            returnKeyType='next'
            onSubmitEditing={() => { passwordRef?.current.focus() }}
            blurOnSubmit={false}
            disabled={isFormSubmitting}
          />
        )}
      />
      <Controller
        control={control}
        name='password'
        defaultValue={password}
        render={({ onChange, onBlur, value }) => (
          <Input
            ref={passwordRef}
            autoCapitalize='none'
            autoCorrect={false}
            autoCompleteType='password'
            style={eva.style.Input}
            value={value}
            keyboardType='visible-password'
            placeholder='Password'
            caption='Must be at least 8 characters long'
            captionIcon={(props) => <Icon {...props} name='alert-circle-outline' />}
            textContentType='password'
            secureTextEntry={secureTextEntry}
            status={value && !isPasswordValid && 'warning'}
            onBlur={onBlur}
            onChangeText={nextValue => {
              setPassword(nextValue)
              onChange(nextValue)
            }}
            accessoryRight={renderIcon}
            disabled={isFormSubmitting}
          />
        )}
      />
      <Divider style={{ height: 14, backgroundColor: color.transparent }} />
      <Text category='label' appearance='hint' onPress={() => navigation.navigate('ForgotPassword')}>FORGOT PASSWORD</Text>
      <Divider style={{ height: 20, backgroundColor: color.transparent }} />
      <Button
        status='primary'
        onPress={handleSubmit(onSubmit)}
        disabled={!isFormValid}
      >
        SIGN IN
      </Button>
      <SnackBar visible={isFormSubmitted && success} textMessage='Sign in is successful.' actionHandler={() => { navigation.navigate('Home') }} actionText='OK' />
      <SnackBar visible={isFormSubmitted && !success} textMessage={`Authentication error.`} autoHidingTime={2000} />
    </View>
  )
})

export const SignInForm = withStyles(SignInFormRaw, theme => ({
  Input: {
    marginVertical: 6,
  },
}))
