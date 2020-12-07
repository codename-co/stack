import React, { useRef, useState } from 'react'
import { TouchableWithoutFeedback, View } from 'react-native'
import { observer } from 'mobx-react-lite'
import { captureException } from 'sentry-expo'
import { useForm, Controller } from 'react-hook-form'
import { Button, Divider, Icon, Input, Text, withStyles } from '@ui-kitten/components'
import { useMutation } from '@apollo/client'
import SnackBar from 'react-native-snackbar-component'
import { AUTHENTICATE, SIGN_UP } from '../../data'
import { color } from '../../theme'
import { RoleType } from '../../types/graphql-global-types'
import type { signUp } from '../../types/signUp'
import type { authenticate } from '../../types/authenticate'
import type { NavigationProp, ParamListBase } from '@react-navigation/native'

const SignUpFormRaw = observer(
  ({ eva, navigation, onSuccess, onError }: {
    eva?: any
    navigation: NavigationProp<ParamListBase>
    onSuccess?: (signUp_userSignUp_userSignUpReturn) => void
    onError?: (ApolloError?) => void
  }) => {
  const { control, handleSubmit } = useForm()
  const [success, setSuccess] = useState<boolean>()
  const [isFormSubmitted, setIsFormSubmitted] = useState<boolean>()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [secureTextEntry, setSecureTextEntry] = React.useState(true)
  const passwordRef = useRef()
  const passwordConfirmationRef = useRef()

  const [ onSubmit, { loading: isFormSubmitting } ] = useMutation<signUp>(SIGN_UP, {
    variables: {
      email,
      password,
      roles: [RoleType.USER],
    },
    fetchPolicy: 'no-cache',
    onCompleted: (data) => {
      console.tron?.display({ name: 'GQL SIGN_UP', value: { data, query: SIGN_UP } })
      const response = data.userSignUpWithRoles.clientMutationId
      const success = Boolean(response)

      setSuccess(success)
      setIsFormSubmitted(true)

      // Once sign up is done, let's sign in immediately, to grab our nifty access token
      signIn()

      onSuccess?.({ email, password })
    },
    onError: (error) => {
      setSuccess(false)
      setIsFormSubmitted(true)

      captureException(error)
      __DEV__ && console.tron?.error(error.message, null)
      onError?.(error)
    }
  })

  const [ signIn ] = useMutation<authenticate>(AUTHENTICATE, {
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
  const isPasswordConfirmationValid = password?.length >= 8 && password === passwordConfirmation
  const isFormValid = isEmailValid && isPasswordValid && isPasswordConfirmationValid

  const toggleSecureEntry = () => {
    setSecureTextEntry(!secureTextEntry)
  }

  const renderIcon = (props) => (
    <TouchableWithoutFeedback onPress={toggleSecureEntry}>
      <Icon {...props} name={secureTextEntry ? 'eye-off' : 'eye'}/>
    </TouchableWithoutFeedback>
  )

  return (
    <View>
      <Text category='label' appearance='hint'>CREATE AN ACCOUNT</Text>
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
            textContentType='password'
            caption='Must be at least 8 characters long'
            captionIcon={(props) => <Icon {...props} name='alert-circle-outline' />}
            secureTextEntry={secureTextEntry}
            status={value && !isPasswordValid && 'warning'}
            onBlur={onBlur}
            onChangeText={nextValue => {
              setPassword(nextValue)
              onChange(nextValue)
            }}
            accessoryRight={renderIcon}
            returnKeyType='next'
            onSubmitEditing={() => { passwordConfirmationRef?.current.focus() }}
            blurOnSubmit={false}
            disabled={isFormSubmitting}
          />
        )}
      />
      {(Boolean(email) || Boolean(password)) && (
        <Controller
          control={control}
          name='passwordConfirmation'
          defaultValue={passwordConfirmation}
          render={({ onChange, onBlur, value }) => (
            <Input
              ref={passwordConfirmationRef}
              autoCapitalize='none'
              autoCorrect={false}
              autoCompleteType='password'
              style={eva.style.Input}
              value={value}
              keyboardType='visible-password'
              placeholder='Password confirmation'
              textContentType='password'
              secureTextEntry={secureTextEntry}
              onBlur={onBlur}
              status={value && !isPasswordConfirmationValid && 'warning'}
              onChangeText={nextValue => {
                setPasswordConfirmation(nextValue)
                onChange(nextValue)
              }}
              accessoryRight={renderIcon}
              disabled={isFormSubmitting}
            />
          )}
        />
      )}
      <Divider style={{ height: 20, backgroundColor: color.transparent }} />
      <Button
        status='primary'
        onPress={handleSubmit(onSubmit)}
        disabled={!isFormValid}
      >
        CREATE MY ACCOUNT
      </Button>
      <SnackBar visible={isFormSubmitted && success} textMessage='Your account was created successfully.' autoHidingTime={5000} />
      <SnackBar visible={isFormSubmitted && !success} textMessage={`Error while creating your account.`} autoHidingTime={2000} />
    </View>
  )
})

export const SignUpForm = withStyles(SignUpFormRaw, theme => ({
  Input: {
    marginVertical: 6,
  },
  HorizontalView: {
    flexDirection: 'row',
  },
}))
