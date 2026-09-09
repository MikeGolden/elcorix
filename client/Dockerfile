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
# Optional privacy-friendly analytics (see SECURITY.md for the CSP change).
ARG VITE_ANALYTICS_SRC=
ENV VITE_ANALYTICS_SRC=$VITE_ANALYTICS_SRC
ARG VITE_ANALYTICS_DOMAIN=
ENV VITE_ANALYTICS_DOMAIN=$VITE_ANALYTICS_DOMAIN
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
