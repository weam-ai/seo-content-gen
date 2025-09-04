# Stage 1: Build Vite app
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json yarn.lock* pnpm-lock.yaml* ./

RUN if [ -f package-lock.json ]; then npm install --legacy-peer-deps; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    elif [ -f pnpm-lock.yaml ]; then npm i -g pnpm && pnpm install --frozen-lockfile; \
    else npm install --legacy-peer-deps; fi

COPY . .

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ARG VITE_API_PYTHON_URL
ENV VITE_API_PYTHON_URL=${VITE_API_PYTHON_URL}

RUN npx vite build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy prod build output
COPY --from=build /app/dist /usr/share/nginx/html/seo-content-gen

# Copy your nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
