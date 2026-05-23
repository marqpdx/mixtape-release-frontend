---
title: Bazaar Checkout and Orders
subsystem: bazaar
area: orders
excerpt: Bazaar checkout and order pages cover payment, order confirmation, order status, and buyer-side actions after an order has been created.
routes:
  - /bazaar/checkout/*
  - /bazaar/orders
  - /bazaar/orders/*
workAreas: []
tags:
  - bazaar
  - checkout
  - orders
  - payment
---

# Bazaar Checkout and Orders

These pages cover the buyer side of Bazaar after you decide to get something.

## What you can do here

- Review an order summary before paying
- Complete payment through Stripe when payment is required
- Skip straight to the order page when an offering is free
- Track order status after payment
- Cancel or complete an order when those actions are available

## Key concepts

**Pending order** — An order has been created, but payment or confirmation is not finished yet.

**Confirmed order** — Payment succeeded and the order is now being processed.

**Fulfillment** — The period when the vendor is actively delivering what you ordered.

## The checkout page

The checkout page is split into two parts:

- **Order Summary** on the left shows what you are buying and the total
- **Payment** on the right initializes Stripe and collects payment details

If the order is free, the system skips card entry and sends you directly to the order page.

## The order detail page

The order detail page is the place to revisit after checkout. It shows:

- the current status
- the offering you ordered
- timeline milestones such as placed, confirmed, fulfilling, delivered, or completed
- any actions you are still allowed to take

## Typical flow

1. Start from an offering page.
2. Create the order.
3. Complete checkout if payment is required.
4. Land on the order page with a success confirmation.
5. Revisit the order page later to check progress or take any remaining action.

## Current limitations

- Some order actions are status-dependent and may disappear once the order moves forward.
- The status language is clear enough to operate with, but still reads like a working internal commerce system rather than a finished consumer storefront.

## Related features

- **Bazaar Browsing** — the storefront pages where an order begins
- **Bazaar Vendor Operations** — the seller-side pages that handle fulfillment after your order is placed

