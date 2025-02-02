FROM node:22-bullseye AS runner

ENV NODE_ENV production
ENV DEBUG 1
# ENV NODE_TLS_REJECT_UNAUTHORIZED 0

WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY / ./

CMD [ "sh", "-c", "npx mesh-compose > schema/supergraph.graphql" ]
