// packages/core/src/types/bazaarTypes.ts

/**
 * Bazaar Types
 *
 * Types for the Bazaar marketplace system including Products, Offerings, Orders, and Stalls.
 */

import type { IsoDateString } from "./groupTypes";

// ---------- Shared unions & enums ----------

export type OfferingShape = 'service' | 'event' | 'program' | 'product';
export type OfferingStatus = 'draft' | 'published' | 'active' | 'unavailable' | 'archived';
export type OfferingVisibility = 'public' | 'members_only' | 'unlisted';
export type OrderStatus = 'pending' | 'confirmed' | 'fulfilling' | 'delivered' | 'completed' | 'cancelled';
export type FulfillmentType = 'auto' | 'manual' | 'external';
export type ProductType = 'physical' | 'digital' | 'service' | 'bundle';
export type ProductStatus = 'active' | 'discontinued';
export type FulfillmentEventType = 'started' | 'delivered' | 'auto_delivered';
export type ActorType = 'user' | 'system';

// ---------- Core models ----------

/**
 * Product - Reusable inventory item that can be referenced by multiple offerings
 */
export interface Product {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description?: string;
  product_type: ProductType;
  status: ProductStatus;
  requires_shipping: boolean;
  sponsor_type: string;
  sponsor_id: string;
  sponsor_display_name?: string;
  created_at: IsoDateString;
  updated_at: IsoDateString;
}

/**
 * BazaarOffering - The purchasable contract/listing
 */
export interface Offering {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description?: string;
  shape: OfferingShape;
  status: OfferingStatus;
  visibility: OfferingVisibility;

  // Pricing (amounts in minor units - cents)
  price_amount: number;
  effective_price: number;  // 0 if is_free=true
  currency: string;
  is_free: boolean;

  // Fulfillment
  fulfillment_type: FulfillmentType;

  // Sponsor (vendor)
  sponsor_type: string;
  sponsor_id: string;
  sponsor_display_name?: string;

  // Optional asset reference
  asset_type?: string;
  asset_id?: string;
  asset_title?: string;

  // Timestamps
  published_at?: IsoDateString;
  created_at: IsoDateString;
  updated_at: IsoDateString;
}

/**
 * OfferingSnapshot - Captured at order creation for immutability
 */
export interface OfferingSnapshot {
  offering_id: string;
  title: string;
  summary: string;
  shape: OfferingShape;
  price_amount: number;
  currency: string;
  is_free: boolean;
  sponsor_id: string;
  sponsor_type: string;
  captured_at: IsoDateString;
}

/**
 * BazaarOrder - A purchase transaction
 */
export interface Order {
  id: string;
  offering: Offering;
  offering_id: string;
  buyer_id: string;
  buyer_username?: string;
  buyer_display_name?: string;
  status: OrderStatus;

  // Money snapshot (minor units)
  amount: number;
  currency: string;

  // Notes
  buyer_note?: string;
  vendor_notes?: string;
  cancellation_reason?: string;

  // Stripe
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;

  // Snapshot
  offering_snapshot?: OfferingSnapshot;

  // Timestamps
  created_at: IsoDateString;
  updated_at: IsoDateString;
}

/**
 * FulfillmentEvent - Audit trail for order fulfillment
 */
export interface FulfillmentEvent {
  id: string;
  order_id: string;
  event_type: FulfillmentEventType;
  actor_type: ActorType;
  actor_user_id?: string;
  actor_username?: string;
  notes?: string;
  created_at: IsoDateString;
}

/**
 * Stall - Virtual vendor storefront (computed, not stored)
 */
export interface Stall {
  sponsor_id: string;
  sponsor_type: string;
  sponsor_display_name: string;
  offerings: Offering[];
  offerings_count: number;
}

/**
 * VendorStats - Dashboard statistics
 */
export interface VendorStats {
  offerings_count: number;
  active_offerings_count: number;
  orders: {
    pending: number;
    confirmed: number;
    fulfilling: number;
    completed: number;
    needs_attention: number;
  };
}

// ---------- Payment types ----------

export interface PaymentIntentResponse {
  payment_intent_id: string | null;
  client_secret: string | null;
  amount: number;
  currency: string;
  free?: boolean;
  order_status?: OrderStatus;
}

export interface PaymentIntentStatus {
  id: string;
  status: string;
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
}

export interface RefundResponse {
  refund_id: string;
  amount: number;
  status: string;
}

// ---------- API Response types ----------

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type ProductsListResponse = PaginatedResponse<Product>;
export type OfferingsListResponse = PaginatedResponse<Offering>;
export type OrdersListResponse = PaginatedResponse<Order>;

// ---------- Form types ----------

export interface ProductCreateFormData {
  title: string;
  summary: string;
  description?: string;
  product_type: ProductType;
  requires_shipping?: boolean;
  sponsor_type: string;
  sponsor_id: string;
}

export interface ProductUpdateFormData extends Partial<ProductCreateFormData> {}

export interface OfferingCreateFormData {
  title: string;
  summary: string;
  description?: string;
  shape: OfferingShape;
  price_amount: number;  // in cents
  currency?: string;
  is_free?: boolean;
  visibility?: OfferingVisibility;
  fulfillment_type?: FulfillmentType;
  status?: OfferingStatus;
  sponsor_type: string;
  sponsor_id: string;
  asset_type?: string;
  asset_id?: string;
}

export interface OfferingUpdateFormData extends Partial<OfferingCreateFormData> {}

export interface OrderCreateFormData {
  offering_id: string;
  buyer_note?: string;
}

// ---------- Action types ----------

export type OfferingAction = 'publish' | 'pause' | 'resume' | 'archive';
export type OrderAction = 'confirm' | 'start_fulfillment' | 'mark_delivered' | 'complete' | 'cancel';

export interface OfferingActionData {
  action: OfferingAction;
}

export interface OrderActionData {
  action: OrderAction;
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  vendor_note?: string;
  notes?: string;
  reason?: string;
}

// ---------- Filter types ----------

export interface OfferingFilters {
  status?: OfferingStatus;
  shape?: OfferingShape;
  sponsor_type?: string;
  sponsor_id?: string;
  include_drafts?: boolean;
}

export interface OrderFilters {
  status?: OrderStatus;
  view?: 'buyer' | 'vendor';
}

export interface ProductFilters {
  sponsor_type?: string;
  sponsor_id?: string;
  product_type?: ProductType;
}

// ---------- Hook return types ----------

export interface UseOfferingsResult {
  offerings: Offering[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseOfferingResult {
  offering: Offering | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseOrdersResult {
  orders: Order[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseOrderResult {
  order: Order | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseStallResult {
  stall: Stall | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseVendorStatsResult {
  stats: VendorStats | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// ---------- Utility functions ----------

/**
 * Format price from minor units (cents) to display string
 */
export const formatPrice = (amount: number, currency: string = 'USD'): string => {
  const dollars = amount / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(dollars);
};

/**
 * Convert dollars to cents (minor units)
 */
export const toCents = (dollars: number): number => {
  return Math.round(dollars * 100);
};

/**
 * Convert cents to dollars
 */
export const toDollars = (cents: number): number => {
  return cents / 100;
};

/**
 * Check if an offering can be purchased
 */
export const isOfferingPurchasable = (offering: Offering): boolean => {
  return offering.status === 'active';
};

/**
 * Check if an order can be cancelled
 */
export const isOrderCancellable = (order: Order): boolean => {
  return ['pending', 'confirmed'].includes(order.status);
};

/**
 * Get human-readable offering shape label
 */
export const getOfferingShapeLabel = (shape: OfferingShape): string => {
  const labels: Record<OfferingShape, string> = {
    service: 'Service',
    event: 'Event',
    program: 'Program',
    product: 'Product',
  };
  return labels[shape] || shape;
};

/**
 * Get human-readable offering status label
 */
export const getOfferingStatusLabel = (status: OfferingStatus): string => {
  const labels: Record<OfferingStatus, string> = {
    draft: 'Draft',
    published: 'Published',
    active: 'Active',
    unavailable: 'Paused',
    archived: 'Archived',
  };
  return labels[status] || status;
};

/**
 * Get human-readable order status label
 */
export const getOrderStatusLabel = (status: OrderStatus): string => {
  const labels: Record<OrderStatus, string> = {
    pending: 'Pending Payment',
    confirmed: 'Confirmed',
    fulfilling: 'In Progress',
    delivered: 'Delivered',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  return labels[status] || status;
};

/**
 * Get status color for UI
 */
export const getOrderStatusColor = (status: OrderStatus): string => {
  const colors: Record<OrderStatus, string> = {
    pending: 'yellow',
    confirmed: 'blue',
    fulfilling: 'cyan',
    delivered: 'teal',
    completed: 'green',
    cancelled: 'red',
  };
  return colors[status] || 'gray';
};

/**
 * Get offering status color for UI
 */
export const getOfferingStatusColor = (status: OfferingStatus): string => {
  const colors: Record<OfferingStatus, string> = {
    draft: 'gray',
    published: 'green',
    active: 'green',
    unavailable: 'yellow',
    archived: 'red',
  };
  return colors[status] || 'gray';
};
