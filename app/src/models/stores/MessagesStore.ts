import { Instance, types } from 'mobx-state-tree'
import { withEnvironment } from '../extensions/with-environment'

const MessageType = types.model().props({
  id: types.optional(types.string, ''),
  // type: types.optional(types.string, ''),
  // title: types.optional(types.string, ''),
  // createdAt: types.optional(types.Date, new Date()),
  isRead: types.optional(types.boolean, true),
})

export const defaults = {
  id: '',
  // type: '',
  // title: '',
  // createdAt: new Date(),
  isRead: true,
}

export const MessagesModel = types.model()
  .props({
    messages: types.optional(types.array(MessageType), []),
  })
  .extend(withEnvironment)
  .views(self => ({
    get unread(): Instance<typeof MessagesModel>[] {
      return self.messages.filter(m => !m.isRead)
    },
  }))
  .actions(self => ({
    initialize: async (list) => {
      self.messages = list
    },
  }))

export const createMessagesModel = () => types.optional(MessagesModel, defaults)
export type MessagesStore = Instance<typeof MessagesModel>
