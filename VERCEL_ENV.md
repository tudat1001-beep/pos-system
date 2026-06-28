# Vercel Environment Variables

## Backend (Vercel Serverless Functions)
```
# Vercel Postgres
POSTGRES_URL=postgres://...
POSTGRES_PRISMA_URL=postgres://...
POSTGRES_URL_NON_POOLING=postgres://...
POSTGRES_USER=default
POSTGRES_HOST=...
POSTGRES_PASSWORD=...
POSTGRES_DATABASE=verceldb

# App
JWT_SECRET=your-super-secret-jwt-key-change-this
```

## Frontend
```
VITE_API_URL=https://your-project.vercel.app/api
```
