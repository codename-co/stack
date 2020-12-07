import { cast, Instance, types } from 'mobx-state-tree'
import { withEnvironment } from '../extensions/with-environment'
import * as storage from '../../utils/storage'
import { apolloClient, query } from '../../utils'
import { GET_CURRENT_USER } from '../../data'
import { RootNavigation } from '../../navigation/navigation-utilities'
import type { getCurrentUser_currentUser } from '../../types/getCurrentUser'
import type { updateCurrentUser_updateUser_user } from '../../types/updateCurrentUser'

const User = types.model().props({
  id: types.string,
  firstName: types.optional(types.string, ''),
  lastName: types.optional(types.string, ''),
  companyName: types.optional(types.string, ''),
  address: types.optional(types.string, ''),
  addressLine1: types.optional(types.string, ''),
  postcode: types.optional(types.string, ''),
  city: types.optional(types.string, ''),
  email: types.optional(types.string, ''),
  phone: types.optional(types.string, ''),
  birthDate: types.optional(types.maybeNull(types.union(types.Date, types.string)), new Date()),
  roles: types.optional(types.array(types.string), []),
})

export const defaults = {
  id: '',
  firstName: '',
  lastName: '',
  companyName: '',
  address: '',
  addressLine1: '',
  postcode: '',
  city: '',
  email: '',
  phone: '',
  birthDate: null,
  roles: [],
}

export const UserStoreModel = types.model()
  .props({
    token: types.optional(types.string, ''),
    data: types.optional(User, defaults),
  })
  .extend(withEnvironment)
  .views(self => ({
    get isUser(): boolean {
      return self.data.roles.includes('USER')
    },
    get isAdmin(): boolean {
      return self.data.roles.includes('ADMIN')
    },
    get isAuthenticated(): boolean {
      return parseInt(self.data.id) > 0
    }
  }))
  .actions(self => ({
    /**
     * Constructor method to initialize the user data.
     */
    initialize: async (userData: getCurrentUser_currentUser | updateCurrentUser_updateUser_user) => {
      if (!userData) {
        return
      }

      self.data = {
        id: userData.id,
        email: userData.email || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        companyName: userData.companyName || '',
        address: userData.address || '',
        addressLine1: userData.addressLine1 || '',
        postcode: userData.postcode || '',
        city: userData.city || '',
        phone: userData.phone || '',
        birthDate: new Date(userData.birthDate),
        roles: cast(userData.usersRoles?.nodes.map(r => r.role)),
      }
    },
  }))
  .actions(self => ({
    /**
     * Update the user data with input data.
     *
     * Alias to `initialize`.
     */
    update: async (userData: getCurrentUser_currentUser | updateCurrentUser_updateUser_user) => {
      console.tron?.log({ name: 'UserStoreModel update', value: { userData } })
      self.initialize(userData)
    },
  }))
  .actions(self => ({
    /**
     * Tries to fetch the latest data for the current user.
     */
    sync: async () => {
      await apolloClient.resetStore()

      query({
        query: GET_CURRENT_USER,
        fetchPolicy: 'no-cache',
      })
        .then(({ data }) => {
          console.tron?.display({ name: 'GQL GET_CURRENT_USER', value: { data, query: GET_CURRENT_USER } })
          self.update(data.currentUser)
        })
        .catch((err) => {
          console.error(err)
        })
    },
  }))
  .actions(self => ({
    /**
     * Persist the user authentication token into async storage.
     */
    authenticate: async (token) => {
      self.token = token
      await storage.save('JWT', token)
      setTimeout(async () => {
        console.tron?.log({ name: 'Token set in storage', value: await storage.load('JWT') })
        RootNavigation.goBack()
        RootNavigation.navigate('Home')
        await self.sync()
      }, 300)
    },

    /**
     * Signs the user out of the session.
     */
    signout: async () => {
      console.tron?.log({ name: 'UserStoreModel signout' })
      storage.clear()
      self.update(defaults as any)
      RootNavigation.resetRoot({ routes: [] })
      RootNavigation.navigate('Home')
    },
  }))

export const createUserStoreModel = () => types.optional(UserStoreModel, defaults)
export type UserStore = Instance<typeof UserStoreModel>
