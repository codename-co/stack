import React, { useEffect, useState } from 'react'
import { Image, View } from 'react-native'
import { Button, Divider, Layout, Spinner, Text, withStyles } from '@ui-kitten/components'
import { observer } from 'mobx-react-lite'
import { useMutation, useQuery } from '@apollo/client'
import { ScrollView } from 'react-native-gesture-handler'
import { Screen, TopNav } from '../../components'
import { color, typography } from '../../theme'
import { GET_MESSAGE, MARK_MESSAGE_READ } from '../../data'
import { dateToString, timeAgo } from '../../utils'
import { getMessageIcon, getMessageTitle, renderMessageContent } from './utils'
import type { markMessageRead } from '../../types/markMessageRead'
import type { getMessage, getMessage_message } from '../../types/getMessage'
import { captureException } from 'sentry-expo'
import { MessageType } from '../../types/graphql-global-types'
const logo = require('../../../assets/icon.png')

const MessageScreenRaw = observer(({ eva, navigation, route }) => {
  const { message_id } = route.params || {}

  const [initialized, setInitialized] = useState(false)
  const [message, setMessage] = useState<getMessage_message>()

  useEffect(() => {
    console.tron?.display({ name: 'Message screen' })
  }, [])

  useQuery<getMessage>(GET_MESSAGE, {
    skip: !message_id,
    variables: {
      messageId: message_id,
    },
    onCompleted: (data) => {
      console.tron?.display({ name: 'GQL GET_MESSAGE', value: { data, query: GET_MESSAGE } })
      const message = data.message
      setMessage(message)
      setInitialized(Boolean(message))
    },
    onError: (error) => {
      captureException(error)
      __DEV__ && console.tron?.error(error.message, null)
    },
  })

  const [ markAsRead ] = useMutation<markMessageRead>(MARK_MESSAGE_READ, {
    variables: {
      messageId: message_id,
    },
    onCompleted: (data) => {
      console.tron?.display({ name: 'GQL MARK_MESSAGE_READ', value: { data, query: MARK_MESSAGE_READ } })
    },
  })

  useEffect(() => {
    markAsRead()
  }, [message_id])

  if (!initialized) {
    return (
      <View>
        <View style={eva.style.Spinner}>
          <Spinner />
        </View>
      </View>
    )
  }

  const messageShouldHaveABackButton = ![MessageType.WELCOME].includes(message.type)

  return (
    <View style={eva.style.MainView}>
      <TopNav
        title={`${getMessageIcon(message)} ${getMessageTitle(message, { short: true })}`}
        onGoPreviousScreen={() => { navigation.navigate('Messages') }}
        // rightIcon='plus-circle-outline'
        // onRightAction={() => {}}
        style={eva.style.TopNav}
      />
      <ScrollView style={eva.style.Container}>
        <Screen preset='scroll' unsafe>
          <Layout style={eva.style.TitleContainer}>
            <Image source={logo} style={eva.style.TitleImage} />
            <Text category='h4' style={eva.style.Title}>{`${getMessageTitle(message, { short: false })}`}</Text>
          </Layout>
          <Layout style={eva.style.ContentContainer}>
            {renderMessageContent(message)}
            {messageShouldHaveABackButton && (
              <>
                <Divider style={{ height: 20, backgroundColor: color.transparent }} />
                <Button
                  status='basic'
                  onPress={() => {
                    navigation.goBack()
                  }}
                >
                  {`CLOSE`}
                </Button>
              </>
            )}
            <Divider style={{ height: 20, backgroundColor: color.transparent }} />
            <Text category='p2' appearance='hint'>—</Text>
            <Text category='p2' appearance='hint'>Message received {timeAgo(message.createdAt)} (on {dateToString(message.createdAt)})</Text>
          </Layout>
        </Screen>
      </ScrollView>
    </View>
  )
})

export const MessageScreen = withStyles(MessageScreenRaw, theme => ({
  MainView: {
    flex: 1,
    backgroundColor: color.palette.lightestGrey,
  },
  TopNav: {
    color: color.palette.white,
    borderWidth: 0,
  },
  Container: {
    flex: 1,
    backgroundColor: theme['color-primary-500'],
  },
  TitleContainer: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
    color: color.palette.white,
    backgroundColor: theme['color-primary-500'],
  },
  TitleImage: {
    width: 100,
    height: 100,
    position: 'absolute',
    bottom: 5,
    right: 0,
    opacity: .3,
  },
  Title: {
    color: color.palette.white,
    fontFamily: typography.heading,
  },
  ContentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  Spinner: {
    position: 'absolute',
    margin: 'auto',
    left: 0,
    right: 0,
    top: 200,
    width: 24,
    height: 24,
  },
}))
