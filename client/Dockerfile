# syntax=docker/dockerfile:1
# Build context must be the repo root (npm workspaces share one lockfile):
#   docker build -f client/Dockerfile .

FROM node:22-alpine AS build
WORKDIR /app
# Vite inlines VITE_* variables into the bundle at build time.
# NOTE: .env.local is excluded from the build context (.dockerignore), so
# every VITE_* variable must be passed as a build ARG here.
ARG VITE_ALTEGIO_COMPANY_ID=000000
ENV VITE_ALTEGIO_COMPANY_ID=$VITE_ALTEGIO_COMPANY_ID
# The booking block is compiled out unless this is "true" — see
# client/src/features.ts.
ARG VITE_ENABLE_ALTEGIO=false
ENV VITE_ENABLE_ALTEGIO=$VITE_ENABLE_ALTEGIO
# Self-hosted Umami analytics — off unless the website id is set; see
# client/src/analytics.ts and README → "Analytics (Umami)".
ARG VITE_UMAMI_WEBSITE_ID=
ENV VITE_UMAMI_WEBSITE_ID=$VITE_UMAMI_WEBSITE_ID
ARG VITE_UMAMI_DOMAINS=
ENV VITE_UMAMI_DOMAINS=$VITE_UMAMI_DOMAINS
COPY package.json package-lock.json ./
COPY client/package.json client/
COPY server/package.json server/
RUN npm ci -w client
COPY client/ client/
RUN npm run build -w client

FROM nginx:1.27-alpine AS runtime
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client/dist /usr/share/nginx/html
EXPOSE 80
