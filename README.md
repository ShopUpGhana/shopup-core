# shopup-core

ShopUp is a Ghana-first, campus-rooted e-commerce platform built initially for university students who sell informally on campus.

This repository represents a complete architectural reset of ShopUp — built from scratch with clarity, modularity, and long-term scale in mind.

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

Status:
