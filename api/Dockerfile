FROM node:12-alpine

ENV DB_CONNECTION_STRING ""
ENV API_AUTH_SECRET "secret"

EXPOSE 80

# Install PostGraphile and its plugins
RUN yarn global add postgraphile@next
COPY package.json .
COPY yarn.lock .
RUN yarn

ENTRYPOINT [ "sh", "-c", "\
  npx postgraphile \
  --plugins @graphile/pg-pubsub \
  --append-plugins @graphile-contrib/pg-simplify-inflector,@graphile-contrib/pg-many-to-many,@graphile/postgis,postgraphile-plugin-connection-filter \
  --skip-plugins graphile-build:NodePlugin \
  --subscriptions \
  --simple-subscriptions \
  --retry-on-init-fail \
  --dynamic-json \
  --no-setof-functions-contain-nulls \
  --no-ignore-rbac \
  --no-ignore-indexes \
  --extended-errors errcode \
  --graphiql / \
  --export-schema-json /schema/schema.json \
  --export-schema-graphql /schema/schema.graphql \
  --enhance-graphiql \
  --enable-query-batching \
  --disable-query-log \
  --legacy-relations omit \
  --connection $DB_CONNECTION_STRING \
  --schema swag,public \
  --default-role default_role \
  --jwt-secret $API_AUTH_SECRET \
  --jwt-verify-audience '' \
  --body-size-limit 10kB \
  --cors \
  --host 0.0.0.0 \
  --port 80" \
]
