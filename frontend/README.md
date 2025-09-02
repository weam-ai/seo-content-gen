# Frontend Application

This is a React application that can run in two modes:

## Development Modes

### 1. Local Development (Default)
Run the app directly on `localhost:3001`:
```bash
npm run dev
```
- Access at: `http://localhost:3001`
- Base path: `/` (root)
- Router basename: `/`

### 2. Nginx Development Mode
Run the app configured for nginx proxy at `/seo`:
```bash
npm run dev:nginx
```
- Access at: `http://localhost:8081/seo` (via nginx)
- Base path: `/seo/`
- Router basename: `/seo`

## Build Modes

### 1. Standard Build
```bash
npm run build
```
- For direct deployment
- Base path: `/`

### 2. Nginx Build
```bash
npm run build:nginx
```
- For deployment behind nginx at `/seo` path
- Base path: `/seo/`

## Environment Variables

- `VITE_USE_NGINX_BASE=true` - Enables nginx mode with `/seo` base path
- `VITE_USE_NGINX_BASE=false` - Standard mode with `/` base path (default)

## Nginx Configuration

The app is designed to work with nginx configuration that proxies:
- `/seo` → `localhost:3001`
- `/` → `localhost:3000` (main app)
