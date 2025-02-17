# Image size ~ 400MB
FROM node:21-alpine3.18 as builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate
ENV PNPM_HOME=/usr/local/bin

COPY package*.json *-lock.yaml ./

# Install build dependencies and git, then install node modules and build
RUN apk add --no-cache --virtual .build-deps \
    python3 \
    make \
    g++ \
    git \
    && pnpm install \
    && pnpm run build \
    && apk del .build-deps

COPY . .

FROM node:21-alpine3.18 as deploy

WORKDIR /app

ARG PORT
ENV PORT $PORT
EXPOSE $PORT

COPY --from=builder /app/assets ./assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

RUN corepack enable && corepack prepare pnpm@latest --activate \
    && pnpm install --prod

CMD ["node", "dist/app.js"]