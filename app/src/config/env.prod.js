const host = window?.location?.hostname

const isLocal = host === 'local-127-0-0-1-swag.on.stack.lol'

const env = isLocal ? 'local' : 'prod'

const graphqlHosts = {
  local: 'http://api-192-168-1-58-local-swag.on.stack.lol/graphql',
  prod: 'https://api.swag.on.stack.lol/graphql',
}

const restHosts = {
  local: 'http://restapi-192-168-1-58-local-swag.on.stack.lol',
  prod: 'https://restapi.swag.on.stack.lol',
}

module.exports = {
  APP_NAME: 'swag',
  GRAPHQL_API_ENDPOINT: graphqlHosts[env],
  REST_API_ENDPOINT: restHosts[env],
}
