<!-- costpassport example: well-scoped marketplace brief — expect Medium confidence, Heavy tier, Needs clarification decision -->
# Three-sided local delivery marketplace MVP

## Overview

A mobile-first, three-sided local delivery marketplace connecting customers, merchants, and couriers in a city.
The platform must support real-time order tracking, mobile money payments, and cash on delivery.

## User Roles

- **Customers / families** — browse merchants, place orders, track delivery in real time, pay via mobile money or cash on delivery
- **Merchants** — receive orders, manage their product catalog, track daily revenue via a merchant dashboard
- **Couriers** — receive delivery assignments, update order status (picked up / en route / delivered), get paid per delivery
- **Admin** — manage users, resolve disputes, configure delivery zones and commission rates

## Core Features

### Order lifecycle
- Customer places order → Merchant confirms → Courier assigned → Order picked up → Order delivered → Payment settled

### Payments
- Mobile money (primary): customer pays on order confirmation
- Cash on delivery: courier collects cash, settlement handled weekly
- Merchant payout: automated or manual weekly settlement

### Delivery tracking
- Real-time GPS-based tracking for customers
- Courier location updates every 30 seconds
- Push notifications at key order status transitions

### Merchant dashboard
- Order queue with accept / reject / ready actions
- Revenue summary (daily, weekly, monthly)
- Product catalog management (add / edit / deactivate)

### Admin back office
- User management (customers, merchants, couriers)
- Dispute resolution queue
- Delivery zone and pricing configuration
- Commission rate management

## Technical Expectations

- Mobile-first UX: React Native / Expo for customer and courier apps
- Web dashboard for merchants and admin: Next.js
- Backend: Node.js + Supabase (Postgres + Realtime)
- Payments: Paystack or Flutterwave (mobile money + card)
- Hosting: Fly.io or Vercel

## MVP Scope

The MVP targets one city with 20 merchants and 10 couriers.
Out of scope for v1: multi-city, ratings/reviews, loyalty program, in-app chat.
