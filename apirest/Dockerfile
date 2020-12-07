FROM node:14-alpine

# Environements
ENV PORT 8080
ENV DATABASE_URL ''
ENV WEBAPP_URL ''

# Make application folder - in dev this folder is shared with host
RUN mkdir /app
WORKDIR /app

# Install npm package
COPY package.json package.json
COPY yarn.lock yarn.lock
RUN yarn install --ignore-engines --production

# Copy application code & compile it
COPY . .
RUN yarn build

# Expose application port
EXPOSE ${PORT}

CMD [ "yarn", "start" ]
