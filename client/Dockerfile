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
# Serve the landing-page photos from client/public/images (committed to the
# repo) instead of hotlinking the Unsplash CDN.
ARG VITE_LOCAL_IMAGES=true
ENV VITE_LOCAL_IMAGES=$VITE_LOCAL_IMAGES
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
