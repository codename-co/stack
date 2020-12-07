/**
 * The root navigator is used to switch between major navigation flows of your app.
 * Generally speaking, it will contain an auth flow (registration, login, forgot password)
 * and a "main" flow (which is contained in your PrimaryNavigator) which the user
 * will use once logged in.
 */
import React from "react"
import { StyleSheet, View } from 'react-native'
import * as Linking from 'expo-linking'
import 'react-native-gesture-handler'
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native'
import { observer } from 'mobx-react-lite'
import { BottomNavigation, BottomNavigationTab, Icon, Text } from '@ui-kitten/components'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { AccountInfoScreen, AccountScreen, AuthenticationScreen, ForgotPasswordScreen, HomeScreen, MessagesScreen } from '../screens'
import { useStores } from '../models'
import { MessageScreen } from "../screens/Messages/MessageScreen"

/**
 * This type allows TypeScript to know what routes are defined in this navigator
 * as well as what properties (if any) they might take when navigating to them.
 *
 * We recommend using MobX-State-Tree store(s) to handle state rather than navigation params.
 *
 * For more information, see this documentation:
 *   https://reactnavigation.org/docs/params/
 *   https://reactnavigation.org/docs/typescript#type-checking-the-navigator
 */
export type RootParamList = {
  primaryStack: undefined
}

const styles = StyleSheet.create({
  NavTab: {
    paddingVertical: 2,
    paddingHorizontal: 1,
  },
})

const AccountIcon = (props) => <Icon {...props} name='person-outline' />
const HomeIcon = (props) => <Icon {...props} name='home-outline' />
const MessagesIcon = observer((props) => {
  const { messages } = useStores()

  return (
    <>
      <Icon {...props} name='bell-outline' />
      {/* Handle the badge display */}
      {Boolean(messages?.unread?.length) && (
        <View
          style={{
            height: 12,
            width: 12,
            paddingVertical: 1,
            backgroundColor: '#59B4B0',
            borderRadius: 10,
            position: 'absolute',
            right: 52,
            top: 5,
          }}
        >
          <Text
            style={{ color: "#fff", textAlign: "center", fontSize: 8 }}
          >
            {/* {messages?.unread?.length} */}
          </Text>
        </View>
      )}
    </>
  )
})

const BottomTabBar = observer(({ navigation, state }) => {
  const { me } = useStores()

  const tabs = []
  if (me.isAuthenticated) {
    tabs.push(<BottomNavigationTab style={styles.NavTab} icon={AccountIcon} title='Account' disabled={!me.isAuthenticated} />)
  }
  tabs.push(<BottomNavigationTab style={styles.NavTab} icon={HomeIcon} title='Home' />)
  if (me.isAuthenticated) {
    tabs.push(<BottomNavigationTab style={styles.NavTab} icon={MessagesIcon} title='Messages' disabled={!me.isAuthenticated} />)
  }

  return (
    <BottomNavigation
      selectedIndex={state.index}
      // indicatorStyle={{ backgroundColor: 'red' }}
      // Action when a tabbar button is taped
      onSelect={index => {
        // if (navigation.canGoBack()) navigation.goBack()
        navigation.navigate(state.routeNames[index], { screen: state.routeNames[index] })
      }}
      {...{ children: tabs }}
    />
  )
})


const HomeStack = createStackNavigator()

function HomeStackScreen () {
  return (
    <HomeStack.Navigator headerMode='none' mode='card'>
      <HomeStack.Screen name='Home' component={HomeScreen} />
      <HomeStack.Screen name='Authentication' component={AuthenticationScreen} />
      <HomeStack.Screen name='ForgotPassword' component={ForgotPasswordScreen} />
    </HomeStack.Navigator>
  )
}


const AccountStack = createStackNavigator()

function AccountStackScreen () {
  return (
    <AccountStack.Navigator headerMode='none' mode='card'>
      <AccountStack.Screen name='Account' component={AccountScreen} />
      <AccountStack.Screen name='AccountInfo' component={AccountInfoScreen} />
    </AccountStack.Navigator>
  )
}


const MessagesStack = createStackNavigator()

function MessagesStackScreen () {
  return (
    <MessagesStack.Navigator headerMode='none' mode='card'>
      <MessagesStack.Screen name='Messages' component={MessagesScreen} />
      <MessagesStack.Screen name='Message' component={MessageScreen} />
    </MessagesStack.Navigator>
  )
}


const Tabs = createBottomTabNavigator()

export const TabNavigator = observer(() => {
  const { me } = useStores()

  const tabs = []
  if (me.isAuthenticated) {
    tabs.push(<Tabs.Screen name='Account' component={AccountStackScreen} />)
  }
  tabs.push(<Tabs.Screen name='Home' component={HomeStackScreen} />)
  if (me.isAuthenticated) {
    tabs.push(<Tabs.Screen name='Messages' component={MessagesStackScreen} />)
  }

  return (
    <Tabs.Navigator
      initialRouteName='Home'
      tabBar={props => <BottomTabBar {...props} />}
      tabBarOptions={{
        showLabel: true,
      }}
      {...{ children: tabs }}
    />
  )
})

// Deep linking
const prefix = Linking.makeUrl('/')
const linking = {
  prefixes: [prefix],
  config: {
    screens: {
      Home: '/',
      Splash: 'loading',
      Account: 'account',
      AccountInfo: 'account/infos',
      Messages: 'messages',
      Message: 'messages/:message_id',
      Authentication: 'auth',
      ForgotPassword: 'auth/forgot-password',
    },
  },
}

export const RootNavigator = React.forwardRef<
  NavigationContainerRef,
  Partial<React.ComponentProps<typeof NavigationContainer>>
>((props, ref) => {
  return (
    <NavigationContainer linking={linking} {...props} ref={ref}>
      <TabNavigator />
    </NavigationContainer>
  )
})

RootNavigator.displayName = 'RootNavigator'
