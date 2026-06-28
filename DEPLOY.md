# Deploy lên Vercel

## Chế độ hoạt động

Dự án hỗ trợ **2 chế độ database**:

| Chế độ | Database | Phù hợp cho | Triển khai |
|--------|----------|--------------|------------|
| **Local** | SQLite | Phát triển, demo | Máy tính của bạn |
| **Production** | Supabase (PostgreSQL) | Deploy thật | Vercel, Render |

---

## Local Development (SQLite)

### Chạy local:
```bash
# Terminal 1: Backend
cd server
npm install
npx prisma db push
npm run dev

# Terminal 2: Frontend
cd client
npm install
npm run dev
```

### Reset database:
```bash
cd server
rm -f prisma/dev.db
npx prisma db push
npx prisma db seed  # Tạo dữ liệu mẫu
```

---

## Production Deployment (Supabase)

### Bước 1: Tạo Supabase Project

1. Đăng ký tài khoản: https://supabase.com
2. Tạo New Project
3. Lấy thông tin từ Settings → Connection String:
   - Host
   - Database password
   - Database name

### Bước 2: Chạy Schema

1. Mở Supabase Dashboard → SQL Editor
2. Copy nội dung file `supabase/schema.sql`
3. Paste và Run

### Bước 3: Deploy Backend (Render.com - Miễn phí)

1. Tạo tài khoản https://render.com
2. **New → PostgreSQL**: Tạo database (hoặc dùng Supabase)
3. **New → Web Service**:
   - Connect GitHub repo
   - Root Directory: `server`
   - Environment: Node
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npm start`
4. Environment Variables:
   ```
   DATABASE_URL=postgresql://user:pass@host:5432/dbname
   JWT_SECRET=your-random-secret-key
   ```

### Bước 4: Deploy Frontend (Vercel - Miễn phí)

1. Push code lên GitHub
2. Import project trên https://vercel.com
3. Root Directory: `client`
4. Framework: Vite
5. Environment Variables:
   ```
   VITE_API_URL=https://your-backend.onrender.com
   ```
6. Deploy!

### Bước 5: Cập nhật API URL

Sau khi deploy backend:
```bash
# Update vercel.json ở client
"rewrites": [
  {
    "source": "/api/:path*",
    "destination": "https://your-actual-backend-url.onrender.com/api/:path*"
  }
]
```

---

## Di chuyển dữ liệu từ SQLite sang Supabase

### Cách 1: Export/Import thủ công

```bash
# Export từ SQLite
sqlite3 prisma/dev.db ".dump" > backup.sql

# Import vào PostgreSQL (cần chỉnh sửa syntax)
psql $DATABASE_URL < backup.sql
```

### Cách 2: Dùng Prisma Migrate

```bash
# Cập nhật schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

# Generate và migrate
npx prisma generate
npx prisma db push
```

---

## Environment Variables

| Biến | Mô tả | Ví dụ |
|------|--------|-------|
| `DATABASE_URL` | Connection string | `file:./dev.db` hoặc `postgresql://...` |
| `JWT_SECRET` | Secret key cho JWT | `abc123xyz...` |
| `VITE_API_URL` | URL backend (frontend) | `https://api.yoursite.com` |

---

## Cấu trúc thư mục

```
pos-system/
├── client/           # React frontend (Vercel)
│   ├── src/
│   ├── vercel.json
│   └── package.json
├── server/           # Express backend (Render)
│   ├── src/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── dev.db     # SQLite local
│   └── package.json
├── supabase/
│   └── schema.sql     # PostgreSQL schema cho Supabase
├── vercel.json
└── DEPLOY.md
```
