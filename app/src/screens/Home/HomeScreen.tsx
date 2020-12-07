import React, { useEffect } from 'react'
import { Dimensions, View } from 'react-native'
import { observer } from 'mobx-react-lite'
import { Button, Divider, Text, withStyles } from '@ui-kitten/components'
import { Screen } from '../../components'
import { color, spacing } from '../../theme'
import { IllustrationNoData } from '../../illustrations'
import { useStores } from '../../models'

const HomeScreenRaw = observer(({ eva, navigation }) => {
  useEffect(() => {
    console.tron?.display({ name: 'Home screen' })
  }, [])

  const authenticate = () => navigation.navigate('Authentication')

  const { me } = useStores()

  return (
    <View style={eva.style.MainView}>
      <Screen style={eva.style.Container} unsafe>
        <Divider style={{ height: 80, backgroundColor: color.transparent }} />
        <IllustrationNoData width={Dimensions.get('window').width} height={200} />
        <Divider style={{ height: 40, backgroundColor: color.transparent }} />
        <View style={eva.style.ActionsContainer}>
          {!me.isAuthenticated ? (
            <>
              <Button status='primary' style={eva.style.Button} onPress={authenticate}>
                SIGN IN
              </Button>
              <Divider style={{ height: 20, backgroundColor: color.transparent }} />
              <Text appearance='hint'>{`Try signing in with: user@example.com / password`}</Text>
            </>
          ) : (
            <>
              <Text category='s1'>{`Dear ${me.data.firstName},`}</Text>
              <Divider style={{ height: 20, backgroundColor: color.transparent }} />
              <Text category='s2'>{`This dashboard could be yours.`}</Text>
              <Divider style={{ height: 40, backgroundColor: color.transparent }} />
              <Text appearance='hint'>{`You may now want to navigate through the bottom navigation tabs ↓`}</Text>
            </>
          )}
        </View>
      </Screen>
    </View>
  )
})

export const HomeScreen = withStyles(HomeScreenRaw, theme => ({
  MainView: {
    flex: 1,
    backgroundColor: color.transparent,
  },
  Container: {
    flex: 1,
  },
  Button: {
    textAlign: 'center',
    maxHeight: 50,
  },
  ActionsContainer: {
    paddingHorizontal: spacing[3],
    flexDirection: 'column',
    marginBottom: spacing[4],
    alignItems: 'center',
  },
}))
