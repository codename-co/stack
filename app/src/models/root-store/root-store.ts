import { Instance, SnapshotOut, types } from 'mobx-state-tree'
import { createMessagesModel } from '../stores/MessagesStore'
import { createUserStoreModel } from '../stores/UserStore'

/**
 * A RootStore model.
 */
//prettier-ignore
export const RootStoreModel = types
  .model('RootStore').props({
    me: createUserStoreModel(),
    messages: createMessagesModel(),
  })

/**
 * The RootStore instance.
 */
export interface RootStore extends Instance<typeof RootStoreModel> {}

/**
 * The data of a RootStore.
 */
export interface RootStoreSnapshot extends SnapshotOut<typeof RootStoreModel> {}
