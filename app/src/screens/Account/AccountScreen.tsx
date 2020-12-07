import React, { useEffect } from 'react'
import { ScrollView, View } from 'react-native'
import { observer } from 'mobx-react-lite'
import { Divider, Spinner, Text, withStyles } from '@ui-kitten/components'
import { Screen, TopNav } from '../../components'
import { color, spacing } from '../../theme'
import { useStores } from '../../models'
import type { NavigationProp, ParamListBase } from '@react-navigation/native'

const AccountScreenRaw = observer(({ eva, navigation }: {
  eva?: any
  navigation: NavigationProp<ParamListBase>
}) => {
  useEffect(() => {
    console.tron?.display({ name: 'Account screen' })
  }, [])

  const { me } = useStores()
  const currentUser = me.data
  const loading = !me.data.id

  if (loading) return <Spinner />

  if (!currentUser) {
    return (
      <Text>'🤷‍♂️'</Text>
    )
  }

  return (
    <View style={eva.style.MainView}>
      <TopNav
        title={`My account`}
        subtitle={`${me.data.email}${__DEV__ && ` (#${me.data.id})`}`}
        // onGoPreviousScreen={() => { navigation.navigate('Home') }}
        rightIcon='person-outline'
        onRightAction={() => { navigation.navigate('AccountInfo') }}
        style={eva.style.TopNav}
      />
      <ScrollView style={eva.style.Container}>
        <Screen preset='scroll' unsafe>
          <Divider style={{ height: 60, backgroundColor: color.transparent }} />
          <Text category='s1'>{`Your swag is bright, ${me.data.firstName}.`}</Text>
          <Divider style={{ height: 20, backgroundColor: color.transparent }} />
          <Text category='s2'>{`Also: you are authenticated.`}</Text>
          <Divider style={{ height: 40, backgroundColor: color.transparent }} />
          <Text appearance='hint'>{`You can now access your personal information details from the top-right action button.`}</Text>
        </Screen>
      </ScrollView>
    </View>
  )
})

export const AccountScreen = withStyles(AccountScreenRaw, theme => ({
  MainView: {
    flex: 1,
    backgroundColor: color.transparent,
  },
  TopNav: {
    // color: color.palette.black,
    // backgroundColor: theme['color-primary-300'],
  },
  Container: {
    flex: 1,
    paddingHorizontal: spacing[3],
  },
}))
