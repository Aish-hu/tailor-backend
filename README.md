# Tailor Backend

Custom-order tailoring shop backend. Node + Express + TypeScript + Prisma (PostgreSQL).

## Setup

```bash
npm install
cp .env.example .env   # fill in your DATABASE_URL, JWT_SECRET, Razorpay keys, Cloudinary keys
npx prisma generate
npx prisma migrate dev --name init
npm run dev             # starts on http://localhost:4000
```

## Key flow

1. Customer registers/logs in (`/api/auth`)
2. Customer fills measurements once (`PUT /api/measurements/me`) — editable anytime
3. Customer browses products (`GET /api/products`), adds to cart with chosen customizations (`POST /api/cart`)
4. Customer adds a delivery address (`POST /api/addresses`)
5. Customer checks out (`POST /api/orders/checkout`) — this **snapshots their current measurements** onto the order (so later profile edits don't affect placed orders), creates a Razorpay order, and returns payment details for the app to open Razorpay checkout
6. App completes Razorpay payment, then calls `POST /api/payments/verify` with the Razorpay response — signature is verified server-side, order status flips to CONFIRMED
7. You (admin) see all orders with full measurements via `GET /api/orders` (requires an ADMIN role user) and update status via `PATCH /api/orders/:id/status`

## Making yourself admin

There's no public "become admin" endpoint (by design — sellers shouldn't be self-service). After registering, manually flip your role in the DB:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@example.com';
```

## Folder structure

- `prisma/schema.prisma` — all data models
- `src/config` — Prisma client, Razorpay client
- `src/middleware/auth.ts` — JWT auth + admin guard
- `src/controllers` — business logic per resource
- `src/routes` — route wiring
- `src/index.ts` — app entry point
