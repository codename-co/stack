import React, { useEffect, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { observer } from 'mobx-react-lite'
import { Button, Divider, Icon, MenuItem, OverflowMenu, Text, withStyles } from '@ui-kitten/components'
import { Screen, TopNav } from '../../components'
import { color, spacing } from '../../theme'
import { useStores } from '../../models'

const AccountInfoScreenRaw = observer(({ eva, navigation }) => {
  const [menuVisible, setMenuVisible] = useState(false)

  useEffect(() => {
    console.tron?.display({ name: 'Account info screen' })
  }, [])

  const { me } = useStores()

  const onItemSelect = (index) => {
    switch (index.row) {
      case 0:
        me.signout()
        break
    }
    setMenuVisible(false)
  }

  const renderToggleButton = () => (
    <Button size='small' onPress={() => setMenuVisible(true)} style={{ minHeight: 1, opacity: 0 }} />
  )

  return (
    <View style={eva.style.MainView}>
      <TopNav
        title='My information'
        onGoPreviousScreen={() => { navigation.navigate('Account') }}
        style={eva.style.TopNav}
        rightIcon='menu-outline'
        onRightAction={() => {
          setMenuVisible(true)
        }}
      />
      <OverflowMenu
        anchor={renderToggleButton}
        // backdropStyle={styles.backdrop}
        visible={menuVisible}
        // selectedIndex={selectedIndex}
        onSelect={onItemSelect}
        onBackdropPress={() => setMenuVisible(false)}
        placement='bottom end'
      >
        <MenuItem title='Sign out' accessoryLeft={(props) => <Icon {...props} name='log-out-outline' />} />
      </OverflowMenu>
      <ScrollView style={eva.style.Container}>
        <Screen preset='scroll' unsafe>
          <Divider style={{ height: 60, backgroundColor: color.transparent }} />
          <Text category='s1'>{`What would you say making this screen something more useful? Something along the lines of a personal information form.`}</Text>
          <Divider style={{ height: 40, backgroundColor: color.transparent }} />
          <Text appearance='hint'>{`You also sign out by using the top-right action button.`}</Text>
          <Divider style={{ height: 20, backgroundColor: color.transparent }} />
          <Text appearance='hint'>{`Or navigate back to the previous screen.`}</Text>
        </Screen>
      </ScrollView>
    </View>
  )
})

export const AccountInfoScreen = withStyles(AccountInfoScreenRaw, theme => ({
  MainView: {
    flex: 1,
    backgroundColor: color.palette.white,
  },
  TopNav: {
    color: color.palette.black,
    backgroundColor: theme['color-basic-100'],
  },
  Container: {
    flex: 1,
    paddingHorizontal: spacing[3],
  },
}))
