# ShopUp Core

ShopUp is a Ghana-first, campus-rooted e-commerce platform built initially for university students who sell informally on campus.

This repository represents the core foundation of ShopUp — built from scratch with clarity, modularity, and long-term scale in mind.

---

## 🎯 Mission

Empower Ghanaian student sellers to formalize, grow, and scale their campus businesses — without unnecessary friction or bureaucracy.

---

## 🧠 Core Principles

1. **Local-first**
   - Designed for Ghana realities (MoMo, campus pickup, WhatsApp-first behavior)

2. **Seller empowerment over platform control**

3. **Trust through verification tiers**
   - Not forced government registration

4. **Mobile-first, low-friction UX**

5. **Start narrow, dominate, then expand**

---

## 🏗 Identity Model (Locked)

- `auth.users` → human identity  
- `sellers` → commerce profile (1-to-1 with user)  
- `products`, `orders`, `payouts` → reference `sellers.id`  

---

## 🛤 Seller Lifecycle

### Status
draft → pending → approved → suspended

shell
Copy code

### Trust Tiers
Campus Seller → Verified → Registered Business

yaml
Copy code

---

## 🧱 Architecture Philosophy

ShopUp Core is built with:

- Dependency Injection (DI)
- Modular feature boundaries
- Adapter pattern (Supabase isolated)
- Loosely coupled services
- Testable business logic
- Minimal runtime dependencies

No overengineering.  
No framework bloat.  
No Amazon cloning.  

---

## 🚀 Initial Pilot

- Ghana university campuses
- Student sellers
- Campus-based discovery feed

---

## 📦 Project Structure (Planned)

/apps
/web
/pages
/assets
/js
/core
/ports
/adapters
/features
/controllers
/bootstrap

/supabase
schema.sql
rls.sql
seed.sql

yaml
Copy code

---

This is ShopUp’s long-term platform foundation — not a demo project.

---

## 🔐 Pages That Use Auth

**2 pages require authentication** (redirect to login if no active session):

| Page | Auth mechanism |
|------|---------------|
| `seller/dashboard.html` | Calls `supabaseClient.auth.getUser()` directly; redirects to login if no user |
| `seller/products.html` | Calls `authService.session()` via `guardSession()` in the controller; redirects to login if no session |

Additionally, `seller/login.html` checks for an existing session on load and redirects already-logged-in users straight to the dashboard.

Public pages (`index.html`, `campus.html`, `seller/register.html`) do not require authentication.
