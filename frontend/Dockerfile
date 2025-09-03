FROM node:20-alpine

WORKDIR /app

# Copy only package files first (to leverage Docker layer caching)
COPY package.json yarn.lock* pnpm-lock.yaml* ./

# Install dependencies with more lenient flags to avoid peer conflicts
# - Using npm install --legacy-peer-deps (instead of npm ci)
# - Falls back to yarn/pnpm if lockfiles exist
RUN if [ -f package-lock.json ]; then npm install --legacy-peer-deps; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    elif [ -f pnpm-lock.yaml ]; then npm i -g pnpm && pnpm install --frozen-lockfile; \
    else npm install --legacy-peer-deps; fi

# Copy application source
COPY . .

# Environment variables
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ARG VITE_API_PYTHON_URL
ENV VITE_API_PYTHON_URL=${VITE_API_PYTHON_URL}

EXPOSE 3001

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
