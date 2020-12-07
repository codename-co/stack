import React, { useEffect } from "react"
import { getStorybookUI, configure } from "@storybook/react-native"
import { initFonts } from "../src/theme/fonts"

declare var module

configure(() => {
  require("./storybook-registry")
}, module)

const StorybookUI = getStorybookUI({
  port: 9001,
  host: "localhost",
  onDeviceUI: true,
  asyncStorage: require("react-native").AsyncStorage,
})

export function StorybookUIRoot() {
  useEffect(() => {
    (async () => {
      await initFonts()
      if (typeof __TEST__ === "undefined" || !__TEST__) {
        const Reactotron = require("../src/services/reactotron")
        const reactotron = new Reactotron.Reactotron()
        reactotron.setup()
      }
    })()
  }, [])

  return <StorybookUI />
}
