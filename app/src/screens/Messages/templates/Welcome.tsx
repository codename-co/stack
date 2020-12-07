import React, { useEffect } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { Button, Divider, Text } from '@ui-kitten/components'
import { useNavigation } from '@react-navigation/native'
import { theme } from '@storybook/react-native/dist/preview/components/Shared/theme'
import { useStores } from '../../../models'
import { color } from '../../../theme'

const styles = StyleSheet.create({
  HorizontalView: {
    flexDirection: 'row',
    justifyContent: 'space-evenly'
  },
})

export const Welcome = () => {
  useEffect(() => {
    console.tron?.display({ name: 'Open Message: Welcome' })
  }, [])

  const { me } = useStores()
  const navigation = useNavigation()

  const showAuthButton = !me.isAuthenticated

  return (
    <>
      <Text category='s1'>Aloha! 🏝️</Text>
      <Divider style={{ height: 20, backgroundColor: color.transparent }} />
      <Text>Your SWAG has never been this much grandiose.</Text>
      <Divider style={{ height: 20, backgroundColor: color.transparent }} />
      <Divider style={{ height: 4, backgroundColor: theme.borderColor }} />
      <Divider style={{ height: 20, backgroundColor: color.transparent }} />
      <Text category='h6'>How can I swag?</Text>
      <Divider style={{ height: 20, backgroundColor: color.transparent }} />
      <Text>There is too much to tell in only one sentence.</Text>
      <Divider style={{ height: 20, backgroundColor: color.transparent }} />
      <View style={styles.HorizontalView}>
        <Button status='primary' onPress={() => {
          navigation.goBack()
          Alert.alert('TODO:', 'Do this already')
          // navigation.navigate('TodoScreen')
        }}>
          DO THIS
        </Button>
        <Divider style={{ height: 20, backgroundColor: color.transparent }} />
        <Button status='warning' onPress={() => {
          navigation.goBack()
          Alert.alert('TODO:', 'Do that already')
          // navigation.navigate('TodoScreen')
        }}>
          DO THAT
        </Button>
      </View>
    </>
  )
}
