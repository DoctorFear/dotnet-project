# --- Build stage ---
FROM node:22-alpine AS build
WORKDIR /app

ARG VITE_API_BASE_URL=http://localhost:8080/api
ARG VITE_APP_MODE=all
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_APP_MODE=$VITE_APP_MODE

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# --- Runtime stage ---
FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]