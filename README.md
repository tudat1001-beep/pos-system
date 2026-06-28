# POS Management System - Hệ thống Quản lý Bán hàng

## Giới thiệu
Hệ thống quản lý bán hàng toàn diện dành cho chủ cửa hàng và nhân viên.

## Tech Stack
- **Frontend**: React 18 + Vite + TypeScript + TailwindCSS
- **Backend**: Node.js + Express + SQLite (Prisma ORM)
- **Auth**: JWT Token

## Vai trò người dùng

### Owner (Chủ cửa hàng)
- Dashboard với thống kê tổng quan
- Quản lý sản phẩm (CRUD)
- Quản lý nhân viên
- Quản lý khách hàng
- Báo cáo doanh thu
- Quản lý kho hàng
- Cài đặt cửa hàng

### Staff (Nhân viên)
- POS (Point of Sale) - Bán hàng
- Quản lý đơn hàng
- Tra cứu khách hàng

## Tài khoản demo
- **Owner**: admin / admin123
- **Staff**: staff / staff123

## Cài đặt

```bash
# Cài đặt dependencies
npm install

# Khởi tạo database
npm run db:push

# Chạy development
npm run dev
```

## Cấu trúc Project
```
├── client/          # React Frontend
├── server/          # Express Backend
├── prisma/          # Database Schema
└── shared/          # Shared Types
```
