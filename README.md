# Set Aside - Backend API

A production-ready NestJS backend for the Set Aside order pickup application, using Supabase as the database and storage provider.

## 📋 Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Database Setup](#database-setup)
- [API Documentation](#api-documentation)
- [Authentication](#authentication)
- [Authorization](#authorization)
- [Order Status Flow](#order-status-flow)
- [File Upload](#file-upload)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)

## 🎯 Overview

Set Aside is an order pickup application where:
- **Customers** place orders for products
- **Cashiers** prepare the orders
- **Customers** pick up their orders when ready

### Key Features

- ✅ Custom JWT authentication (not Supabase Auth)
- ✅ Role-based access control (customer, cashier, admin)
- ✅ Order status workflow with validation
- ✅ Product image upload to Supabase Storage
- ✅ Row Level Security (RLS) policies
- ✅ Auto-calculated order totals
- ✅ Swagger API documentation

## 🛠 Technology Stack

- **Framework**: NestJS 10.x
- **Database**: PostgreSQL (Supabase)
- **Authentication**: JWT with Passport
- **Validation**: class-validator + class-transformer
- **Documentation**: Swagger/OpenAPI
- **Storage**: Supabase Storage

## 📁 Project Structure

```
src/
├── main.ts                          # Application entry point
├── app.module.ts                    # Root module
├── common/
│   ├── decorators/
│   │   ├── current-user.decorator.ts   # Extract user from request
│   │   ├── public.decorator.ts         # Mark routes as public
│   │   └── roles.decorator.ts          # Role-based access
│   ├── entities/
│   │   ├── user.entity.ts
│   │   ├── product.entity.ts
│   │   ├── order.entity.ts
│   │   └── order-item.entity.ts
│   ├── enums/
│   │   └── index.ts                    # UserRole, OrderStatus
│   └── guards/
│       ├── jwt-auth.guard.ts           # JWT authentication
│       └── roles.guard.ts              # Role authorization
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.repository.ts
│   │   ├── dto/
│   │   │   └── auth.dto.ts
│   │   └── strategies/
│   │       └── jwt.strategy.ts
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.repository.ts
│   │   └── dto/
│   │       └── users.dto.ts
│   ├── products/
│   │   ├── products.module.ts
│   │   ├── products.controller.ts
│   │   ├── products.service.ts
│   │   ├── products.repository.ts
│   │   └── dto/
│   │       └── products.dto.ts
│   ├── orders/
│   │   ├── orders.module.ts
│   │   ├── orders.controller.ts
│   │   ├── orders.service.ts
│   │   ├── orders.repository.ts
│   │   └── dto/
│   │       └── orders.dto.ts
│   ├── order-items/
│   │   ├── order-items.module.ts
│   │   ├── order-items.controller.ts
│   │   ├── order-items.service.ts
│   │   ├── order-items.repository.ts
│   │   └── dto/
│   │       └── order-items.dto.ts
│   └── supabase/
│       ├── supabase.module.ts
│       └── supabase.service.ts
supabase/
├── schema.sql                       # Database schema
├── rls-policies.sql                 # Row Level Security policies
└── bucket-setup.sql                 # Storage bucket setup
postman/
└── Set-Aside-API.postman_collection.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   cd new-be-setaside
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

4. **Set up database** (see [Database Setup](#database-setup))

5. **Start the server**
   ```bash
   # Development
   npm run start:dev

   # Production
   npm run build
   npm run start:prod
   ```

6. **Access the API**
   - API: http://localhost:3000/api/v1
   - Swagger Docs: http://localhost:3000/docs

## 🗄 Database Setup

### 1. Run Schema Migration

In your Supabase SQL Editor, run the files in order:

1. `supabase/schema.sql` - Creates tables, functions, triggers
2. `supabase/rls-policies.sql` - Sets up Row Level Security
3. `supabase/bucket-setup.sql` - Creates storage bucket

### 2. Create Admin User

After running migrations, create an admin user via API or directly in database:

```sql
-- Password: Admin123! (hashed with bcrypt, 10 rounds)
INSERT INTO users (email, password_hash, full_name, role) VALUES
('admin@setaside.com', '$2b$10$YourHashedPasswordHere', 'System Admin', 'admin');
```

Or register through the API and update the role:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@setaside.com';
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Endpoints

#### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login | No |
| GET | `/auth/me` | Get current user | Yes |

#### Users
| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/users/me` | Get my profile | Yes | Any |
| PATCH | `/users/me` | Update my profile | Yes | Any |
| GET | `/users` | List all users | Yes | Admin |

#### Products
| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/products` | List products | No | - |
| GET | `/products/categories` | Get categories | No | - |
| GET | `/products/:id` | Get product | No | - |
| POST | `/products` | Create product | Yes | Cashier/Admin |
| PATCH | `/products/:id` | Update product | Yes | Cashier/Admin |
| DELETE | `/products/:id` | Delete product | Yes | Cashier/Admin |
| POST | `/products/:id/image` | Upload image | Yes | Cashier/Admin |

#### Orders
| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| POST | `/orders` | Create order | Yes | Any |
| GET | `/orders` | List orders | Yes | Any* |
| GET | `/orders/:id` | Get order | Yes | Any* |
| PATCH | `/orders/:id` | Update order | Yes | Any* |
| PATCH | `/orders/:id/status` | Update status | Yes | Cashier/Admin |
| DELETE | `/orders/:id` | Delete order | Yes | Any* |

*Customers can only access their own orders

#### Order Items
| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/orders/:id/items` | Get items | Yes | Any* |
| POST | `/orders/:id/items` | Add item | Yes | Any* |
| PATCH | `/orders/:id/items/:itemId` | Update item | Yes | Any* |
| DELETE | `/orders/:id/items/:itemId` | Remove item | Yes | Any* |

*Only for own pending orders

## 🔐 Authentication

The API uses custom JWT authentication (not Supabase Auth).

### Getting a Token

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "Password123!"}'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 604800,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "customer"
  }
}
```

### Using the Token

```bash
curl -X GET http://localhost:3000/api/v1/orders \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### JWT Payload Structure

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "customer",
  "iat": 1234567890,
  "exp": 1234567890
}
```

## 👮 Authorization

### Roles

| Role | Description |
|------|-------------|
| `customer` | Can create orders, view/manage own orders |
| `cashier` | Can manage products, view all orders, update status |
| `admin` | Full access to all resources |

### Role Hierarchy

```
admin > cashier > customer
```

### RLS Policies

Row Level Security is enabled on all tables:

- **users**: Users can only read/update own profile
- **products**: Public read, staff write
- **orders**: Customers see own, staff see all
- **order_items**: Same as orders, plus pending-only modifications

## 📦 Order Status Flow

Orders follow a strict status progression:

```
pending → preparing → ready → picked_up
```

### Status Rules

| Status | Who Can Set | Description |
|--------|-------------|-------------|
| `pending` | System | Initial status on creation |
| `preparing` | Cashier/Admin | Order is being prepared |
| `ready` | Cashier/Admin | Ready for pickup |
| `picked_up` | Cashier/Admin | Customer has picked up |

### Constraints

- Only **pending** orders can be modified/deleted by customers
- Status can only move forward (no going back)
- Invalid transitions return `400 Bad Request`

## 📤 File Upload

Product images are stored in Supabase Storage.

### Upload Image

```bash
curl -X POST http://localhost:3000/api/v1/products/{id}/image \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/image.jpg"
```

### Constraints

- Max file size: 5MB
- Allowed types: JPEG, PNG, WebP, GIF
- Staff only (cashier/admin)

### Image URL

Images are publicly accessible:
```
https://{project}.supabase.co/storage/v1/object/public/product-images/{filename}
```

## ⚙️ Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | development |
| `PORT` | Server port | 3000 |
| `API_PREFIX` | API path prefix | api/v1 |
| `SUPABASE_URL` | Supabase project URL | - |
| `SUPABASE_ANON_KEY` | Supabase anon key | - |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | Token expiration | 7d |
| `BCRYPT_SALT_ROUNDS` | Password hash rounds | 10 |
| `CORS_ORIGINS` | Allowed origins | * |
| `STORAGE_BUCKET_NAME` | Storage bucket | product-images |

## 🚢 Deployment

### Production Checklist

1. ✅ Set strong `JWT_SECRET`
2. ✅ Use `NODE_ENV=production`
3. ✅ Configure proper CORS origins
4. ✅ Enable HTTPS
5. ✅ Set up monitoring/logging
6. ✅ Configure rate limiting

### Docker (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
```

### Build & Run

```bash
npm run build
NODE_ENV=production node dist/main
```

## 📮 Postman Collection

Import `postman/Set-Aside-API.postman_collection.json` into Postman for a complete API testing environment.

The collection includes:
- All endpoints with examples
- Auto-token saving on login
- Environment variables

## 📝 License

MIT

---

**Set Aside Backend** - Built with ❤️ using NestJS and Supabase
