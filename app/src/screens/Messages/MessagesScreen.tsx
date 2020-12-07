import React, { useEffect } from 'react'
import { Dimensions, ScrollView, View } from 'react-native'
import { useQuery } from '@apollo/client'
import { observer } from 'mobx-react-lite'
import { Divider, List, ListItem, Text, withStyles } from '@ui-kitten/components'
import { TopNav, Screen } from '../../components'
import { color, spacing } from '../../theme'
import { LIST_MESSAGES } from '../../data'
import { useStores } from '../../models'
import { timeAgo } from '../../utils'
import { getMessageIcon, getMessageTitle } from './utils'
import { IllustrationNoData } from '../../illustrations'
import type { listMessages, listMessages_messages_nodes } from '../../types/listMessages'
import type { NavigationProp, ParamListBase } from '@react-navigation/native'

const MessagesScreenRaw = observer(({ eva, navigation }: { eva?: any; navigation: NavigationProp<ParamListBase> }) => {
  useEffect(() => {
    console.tron?.display({ name: 'Messages screen' })
  }, [])

  const { me, messages: myMessages } = useStores()

  const currentUser = me.data

  if (!currentUser) {
    return (
      <Text>'🤷‍♂️'</Text>
    )
  }

  const { data } = useQuery<listMessages>(LIST_MESSAGES, {
    skip: !currentUser,
    variables: {
      recipientId: currentUser.id,
    },
    pollInterval: 4000,
    onCompleted: (data) => {
      console.tron?.display({ name: 'GQL LIST_MESSAGES', value: { data, query: LIST_MESSAGES } })
    }
  })
  const messages = data?.messages.nodes

  useEffect(() => {
    myMessages.initialize(messages)
  }, [messages])

  const newMessages = messages?.filter(m => !m.isRead).length
  const title = `Messages${Boolean(newMessages) ? ` (${newMessages} unread)` : ''}`

  return (
    <View style={eva.style.MainView}>
      <TopNav
        title={title}
        subtitle={`${me.data.email}${__DEV__ && ` (#${me.data.id})`}`}
        style={eva.style.TopNav}
      />
      <ScrollView style={eva.style.Container}>
        <Screen preset='scroll' unsafe>
          <Divider style={{ height: 20, backgroundColor: color.transparent }} />
          {!messages?.length ? (
            <>
              <Divider style={{ backgroundColor: color.transparent, height: 40 }} />
              <IllustrationNoData width={Dimensions.get('window').width} height={100} />
              <Divider style={{ backgroundColor: color.transparent, height: 20 }} />
              <Text appearance='hint' style={eva.style.FallbackText}>No message just yet</Text>
              <Divider style={{ backgroundColor: color.transparent, height: 20 }} />
            </>
          ) : (
            <List
              style={eva.style.MessageList}
              data={messages}
              ItemSeparatorComponent={() => <Divider style={{ backgroundColor: color.transparent, height: 8 }} />}
              renderItem={({ item: message }: { item: listMessages_messages_nodes }) => (
                <ListItem
                  title={`${getMessageIcon(message) ? `${getMessageIcon(message)} ` : ``}${getMessageTitle(message, { short: true })}`}
                  accessoryRight={(props) => <Text status={!message.isRead && 'info'} appearance='hint'>●  </Text>}
                  description={timeAgo(message.createdAt)}
                  style={eva.style.Message}
                  onPress={() => navigation.navigate('Message', { message_id: message.id })}
                  // accessoryRight={(props) => (
                  //   <Icon style={message.isRead ? eva.style.IsRead : eva.style.IsUnread} {...props} name='radio-button-off'/>
                  // )}
                />
              )}
            />
          )}
          <Divider style={{ height: 50, backgroundColor: color.transparent }} />
        </Screen>
      </ScrollView>
    </View>
  )
})

export const MessagesScreen = withStyles(MessagesScreenRaw, theme => ({
  MainView: {
    flex: 1,
    backgroundColor: color.palette.lightestGrey,
    // backgroundColor: theme['color-basic-900'],
  },
  TopNav: {
    // color: color.palette.black,
    // backgroundColor: color.palette.lightestGrey,
  },
  Container: {
    flex: 1,
  },
  Text: {
    color: 'white',
    backgroundColor: theme['color-primary-default'],
    textAlign: 'center',
  },
  MessageList: {
    paddingTop: 40,
  },
  Message: {
    borderBottomColor: theme['color-basic-300'],
    borderBottomWidth: 1,
  },
  IsRead: {
    color: color.palette.lightestGrey,
  },
  IsUnread: {
    color: theme['color-info-500'],
  },
  FallbackText: {
    paddingHorizontal: spacing[4],
    textAlign: 'center',
  },
}))
