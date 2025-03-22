FROM node:23-alpine AS node-builder

RUN apk add --no-cache git

RUN git clone --depth 1 --branch master https://github.com/terrastruct/d2-playground.git /app

WORKDIR /app

# install esbuild
RUN npm install --save-exact --save-dev esbuild

# pull the submodules (D2's VSCode plugin for syntax highlighting, and our CI library).
RUN git submodule update --init --recursive

# build the JS
RUN (cd src/js && yarn install --production --frozen-lockfile)



FROM golang:1.24-alpine AS go-builder

WORKDIR /app

COPY --from=node-builder /app /app

RUN go build -o main .


FROM golang:1.24-alpine

WORKDIR /app

COPY --from=go-builder /app /app

EXPOSE 9090

CMD ["./main"]
