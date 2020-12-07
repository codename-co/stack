import React from 'react'
import * as Templates from './templates'
import { MessageType } from '../../types/graphql-global-types'
import type { getMessage_message } from '../../types/getMessage'

interface MessageTitleOptions {
  short?: boolean
}

/**
 * Compute the message title from its type.
 *
 * @param message Message
 */
export function getMessageTitle(message: getMessage_message, options?: MessageTitleOptions): string {
  if (!message) {
    return '?'
  }

  switch (message?.type) {
    case MessageType.CUSTOM:
      if (options?.short) {
        return message.title.length > 32 ? `${message.title.substr(0, 32)}…` : message.title
      } else {
        return message.title
      }
    case MessageType.WELCOME:
      return `Welcome to Swag`
    default:
      return `New message`
  }
}

/**
 * Compute the message icon from its type.
 *
 * @param message Message
 */
export function getMessageIcon(message: getMessage_message): string {
  switch (message?.type) {
    case MessageType.WELCOME:
      return `👋`
    default:
      return ``
  }
}

export function renderMessageContent(message: getMessage_message) {
  const template = message.type || 'custom'
  const Template = template.toLowerCase().replace(/^(.)/, (_, c) => c.toUpperCase()).replace(/_+(.)/g, (_, c) => c.toUpperCase())
  const Component = Templates[Template]

  return (
    <Component {...message} />
  )
}
