# syntax=docker/dockerfile:1
# Build context must be the repo root (npm workspaces share one lockfile):
#   docker build -f server/Dockerfile .

FROM node:22-alpine AS build
WORKDIR /app
# Manifests for both workspaces so the lockfile resolves consistently.
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci -w server
COPY server/ server/
RUN npm run build -w server

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci -w server --omit=dev && npm cache clean --force
COPY --from=build /app/server/dist server/dist
USER node
EXPOSE 3001
# Apply the (idempotent) schema before starting the API.
CMD ["sh", "-c", "node server/dist/db/migrate.js && node server/dist/index.js"]
