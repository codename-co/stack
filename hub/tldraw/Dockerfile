FROM node:24-alpine AS builder

WORKDIR /app

COPY ./src .

# build the JS
RUN npm ci && npm run build


FROM lipanski/docker-static-website:latest

COPY --from=builder /app/dist .
