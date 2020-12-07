import React from 'react'
import { StatusBar, StyleProp, ViewStyle } from 'react-native'
import { Icon, Layout, Text, TopNavigation, TopNavigationAction, withStyles } from '@ui-kitten/components'
import { typography } from '../../theme'
import { palette } from '../../theme/palette'

const TopNavRaw = ({ eva, title, subtitle, leftIcon = 'arrow-back', onGoPreviousScreen, rightIcon, onRightAction, style }: {
  eva?: any
  title: string
  subtitle?: string
  leftIcon?: string
  onGoPreviousScreen?: (GestureResponderEvent) => void
  rightIcon?: string
  onRightAction?: (GestureResponderEvent) => void
  style?: StyleProp<ViewStyle>
}) => {
  const renderBackAction = () => (
    <TopNavigationAction
      icon={(props) => <Icon {...props} name={leftIcon} />}
      onPress={onGoPreviousScreen}
    />
  )

  const renderRightAction = () => (
    <TopNavigationAction
      icon={(props) => <Icon {...props} name={rightIcon} />}
      onPress={onRightAction}
    />
  )

  return (
    <Layout style={eva.style.View} level='1'>
      <TopNavigation
        style={[ eva.style.Navbar, style ]}
        alignment='center'
        title={(props) => <Text {...props} style={eva.style.Text}>{title}</Text>}
        subtitle={subtitle}
        accessoryLeft={() => Boolean(onGoPreviousScreen) && renderBackAction()}
        accessoryRight={() => Boolean(onRightAction) && renderRightAction()}
      />
    </Layout>
  )
}

export const TopNav = withStyles(TopNavRaw, theme => ({
  View: {
    shadowColor: palette.lightGrey,
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 3,
    zIndex: 10,
    paddingTop: StatusBar.currentHeight,
  },
  Navbar: {
    backgroundColor: 'white',
  },
  Text: {
    fontFamily: typography.heading,
  },
}))
