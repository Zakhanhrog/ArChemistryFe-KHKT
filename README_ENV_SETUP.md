# Frontend Environment Variables Setup Guide

## Quick Start

1. Copy the example file:
```bash
cp .env.example .env
```

2. Edit `.env` file and fill in your actual values:
```bash
nano .env  # or use your preferred editor
```

3. **IMPORTANT**: Never commit `.env` file to git! It's already in `.gitignore`.

4. Restart your dev server:
```bash
npm run dev
```

## Required Variables

### API Configuration
```env
# Backend API base URL
# Development: http://localhost:8080
# Production: https://api.chemar.ai.vn
VITE_API_BASE_URL=http://localhost:8080
```

### Google OAuth
```env
# Get from: https://console.cloud.google.com/apis/credentials
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## How It Works

Vite exposes environment variables to the client code via `import.meta.env`.

**Important**: Only variables prefixed with `VITE_` are exposed to the client for security reasons.

### Usage in Code

```javascript
import { getApiBaseUrl, getGoogleClientId } from '@/utils/config';

const apiUrl = getApiBaseUrl();
const clientId = getGoogleClientId();
```

Or directly:
```javascript
const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
```

## Production Build

For production builds, create `.env.production`:

```env
VITE_API_BASE_URL=https://api.chemar.ai.vn
VITE_GOOGLE_CLIENT_ID=your_production_client_id
```

Then build:
```bash
npm run build
```

The environment variables will be embedded in the build at build time.

## Development vs Production

- **Development**: Uses `.env` or `.env.local`
- **Production**: Uses `.env.production` (must be created)

Vite automatically loads the correct file based on the mode.

