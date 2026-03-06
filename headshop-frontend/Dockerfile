FROM node:20-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

COPY . .

ARG VITE_API_URL=/api
ARG VITE_ERP_API_URL=/api/erp
ARG VITE_ERP_URL=http://localhost:8081/login

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_ERP_API_URL=${VITE_ERP_API_URL}
ENV VITE_ERP_URL=${VITE_ERP_URL}

RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY nginx.hostinger.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
