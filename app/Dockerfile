# 1. Install dependencies
FROM node:12-alpine
# AS builder
WORKDIR /app
RUN apk add git
# RUN yarn config set prefix ~/.yarn
RUN yarn global add expo-cli
COPY package.json yarn.lock .solidarity ./
RUN yarn install

# 2. Fetch dependencies, copy sources & start
# FROM node:12-alpine
ENV GRAPHQL_API_ENDPOINT ""
ENV APP_NAME swag
ENV WEB_PORT 80
EXPOSE 80
# WORKDIR /app
# COPY --from=builder /root/.yarn ~/.yarn
# COPY --from=builder /app/node_modules ./node_modules
COPY . .
CMD [ "yarn", "web" ]
