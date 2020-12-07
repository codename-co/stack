import { createHttpLink, ApolloClient, InMemoryCache, QueryOptions, MutationOptions, ApolloQueryResult } from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { onError } from '@apollo/client/link/error'
import { Alert, DevSettings, FetchResult } from 'react-native'
import { GRAPHQL_API_ENDPOINT } from '../config/env'
import { RootNavigation } from '../navigation'
import * as storage from './storage'
const JWT_TOKEN_PERSISTENCE_KEY = 'JWT'

// GraphQL client
const httpLink = createHttpLink({
  uri: GRAPHQL_API_ENDPOINT,
})

const withToken = setContext(async ({ operationName }, { headers }) => {
  const isTryingToAuthenticate = operationName === 'authenticate'
  if (isTryingToAuthenticate) {
    return {}
  }

  // get the authentication token from local storage if it exists
  const token = (await storage.load(JWT_TOKEN_PERSISTENCE_KEY)) || ''
  // return the headers to the context so httpLink can read them
  const response = { headers: { ...headers }}
  if (token) {
    response.headers.authorization = `Bearer ${token}`
    console.tron?.debug(`Bearer token set to <${token}>`)
  }
  return response
})

const resetToken = onError(({ networkError }) => {
  if (networkError && networkError.statusCode === 401) {
    // remove cached token on 401 from the server
    networkError = undefined
    storage.clear()
    RootNavigation.resetRoot({ routes: [] })
    DevSettings.reload()
  }
})

const authFlowLink = withToken.concat(resetToken)

const link = authFlowLink.concat(httpLink)

const cache = new InMemoryCache()

export const apolloClient = new ApolloClient({
  link,
  cache,
})

console.tron?.debug(`GraphQL client connected to <${GRAPHQL_API_ENDPOINT}>`)

export async function query (args: QueryOptions<Record<string, any>, any>): Promise<ApolloQueryResult<any>> {
  return apolloClient.query(args)
}

export async function mutate (args: MutationOptions<Record<string, any>, any>): Promise<FetchResult> {
  return apolloClient.mutate(args) as any
}
