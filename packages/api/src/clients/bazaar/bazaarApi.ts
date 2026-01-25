// packages/api/src/clients/bazaar/bazaarApi.ts

/**
 * Bazaar API Client
 *
 * API functions for the Bazaar marketplace system.
 * Note: URLs have no trailing slashes (APPEND_SLASH=False on backend).
 */

import {
  Offering,
  OfferingsListResponse,
  OfferingCreateFormData,
  OfferingUpdateFormData,
  OfferingActionData,
  OfferingFilters,
  Order,
  OrdersListResponse,
  OrderCreateFormData,
  OrderActionData,
  OrderFilters,
  Product,
  ProductsListResponse,
  ProductCreateFormData,
  ProductUpdateFormData,
  ProductFilters,
  Stall,
  VendorStats,
  PaymentIntentResponse,
  PaymentIntentStatus,
  RefundResponse,
} from '@mixtape/core/types/bazaarTypes';
import { axiosInstance } from '../../lib/axiosInstance';
import { unwrapListResponse } from '../../lib/utils';

// ============================================================================
// PRODUCT API FUNCTIONS
// ============================================================================

/**
 * Fetch products with optional filters
 */
export async function fetchProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, value.toString());
    }
  });

  const queryString = params.toString();
  const url = `/api/bazaar/products${queryString ? `?${queryString}` : ''}`;

  const response = await axiosInstance.get<ProductsListResponse>(url);
  return unwrapListResponse<Product>(response.data);
}

/**
 * Fetch a single product by ID
 */
export async function fetchProduct(id: string): Promise<Product> {
  const response = await axiosInstance.get<Product>(`/api/bazaar/products/${id}`);
  return response.data;
}

/**
 * Create a new product
 */
export async function createProduct(data: ProductCreateFormData): Promise<Product> {
  const response = await axiosInstance.post<Product>('/api/bazaar/products', data);
  return response.data;
}

/**
 * Update a product
 */
export async function updateProduct(id: string, data: ProductUpdateFormData): Promise<Product> {
  const response = await axiosInstance.patch<Product>(`/api/bazaar/products/${id}`, data);
  return response.data;
}

/**
 * Delete a product (soft delete)
 */
export async function deleteProduct(id: string): Promise<void> {
  await axiosInstance.delete(`/api/bazaar/products/${id}`);
}

// ============================================================================
// OFFERING API FUNCTIONS
// ============================================================================

/**
 * Fetch offerings with optional filters
 */
export async function fetchOfferings(filters: OfferingFilters = {}): Promise<Offering[]> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, value.toString());
    }
  });

  const queryString = params.toString();
  const url = `/api/bazaar/offerings${queryString ? `?${queryString}` : ''}`;

  const response = await axiosInstance.get<OfferingsListResponse>(url);
  return unwrapListResponse<Offering>(response.data);
}

/**
 * Fetch a single offering by ID
 */
export async function fetchOffering(id: string): Promise<Offering> {
  const response = await axiosInstance.get<Offering>(`/api/bazaar/offerings/${id}`);
  return response.data;
}

/**
 * Create a new offering (starts in draft status)
 */
export async function createOffering(data: OfferingCreateFormData): Promise<Offering> {
  const response = await axiosInstance.post<Offering>('/api/bazaar/offerings', data);
  return response.data;
}

/**
 * Update an offering
 */
export async function updateOffering(id: string, data: OfferingUpdateFormData): Promise<Offering> {
  const response = await axiosInstance.patch<Offering>(`/api/bazaar/offerings/${id}`, data);
  return response.data;
}

/**
 * Perform an action on an offering (publish, pause, resume, archive)
 */
export async function offeringAction(id: string, data: OfferingActionData): Promise<Offering> {
  const response = await axiosInstance.post<Offering>(`/api/bazaar/offerings/${id}/action`, data);
  return response.data;
}

/**
 * Delete an offering (soft delete via archive)
 */
export async function deleteOffering(id: string): Promise<void> {
  await axiosInstance.delete(`/api/bazaar/offerings/${id}`);
}

// ============================================================================
// ORDER API FUNCTIONS
// ============================================================================

/**
 * Fetch orders with optional filters
 */
export async function fetchOrders(filters: OrderFilters = {}): Promise<Order[]> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, value.toString());
    }
  });

  const queryString = params.toString();
  const url = `/api/bazaar/orders${queryString ? `?${queryString}` : ''}`;

  const response = await axiosInstance.get<OrdersListResponse>(url);
  return unwrapListResponse<Order>(response.data);
}

/**
 * Fetch a single order by ID
 */
export async function fetchOrder(id: string): Promise<Order> {
  const response = await axiosInstance.get<Order>(`/api/bazaar/orders/${id}`);
  return response.data;
}

/**
 * Create a new order
 */
export async function createOrder(data: OrderCreateFormData): Promise<Order> {
  const response = await axiosInstance.post<Order>('/api/bazaar/orders', data);
  return response.data;
}

/**
 * Perform an action on an order
 */
export async function orderAction(id: string, data: OrderActionData): Promise<Order> {
  const response = await axiosInstance.post<Order>(`/api/bazaar/orders/${id}/action`, data);
  return response.data;
}

// ============================================================================
// STALL API FUNCTIONS
// ============================================================================

/**
 * Fetch a stall (virtual vendor storefront)
 */
export async function fetchStall(sponsorType: string, sponsorId: string): Promise<Stall> {
  const response = await axiosInstance.get<Stall>(`/api/bazaar/stalls/${sponsorType}/${sponsorId}`);
  return response.data;
}

// ============================================================================
// VENDOR API FUNCTIONS
// ============================================================================

/**
 * Fetch vendor orders (orders for offerings I own)
 */
export async function fetchVendorOrders(filters: Omit<OrderFilters, 'view'> = {}): Promise<Order[]> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, value.toString());
    }
  });

  const queryString = params.toString();
  const url = `/api/bazaar/vendor/orders${queryString ? `?${queryString}` : ''}`;

  const response = await axiosInstance.get<OrdersListResponse>(url);
  return unwrapListResponse<Order>(response.data);
}

/**
 * Fetch vendor statistics
 */
export async function fetchVendorStats(): Promise<VendorStats> {
  const response = await axiosInstance.get<VendorStats>('/api/bazaar/vendor/stats');
  return response.data;
}

// ============================================================================
// PAYMENT API FUNCTIONS
// ============================================================================

/**
 * Create a PaymentIntent for an order
 */
export async function createPaymentIntent(orderId: string): Promise<PaymentIntentResponse> {
  const response = await axiosInstance.post<PaymentIntentResponse>(
    '/api/bazaar/payments/create-intent',
    { order_id: orderId }
  );
  return response.data;
}

/**
 * Get PaymentIntent status
 */
export async function getPaymentIntentStatus(paymentIntentId: string): Promise<PaymentIntentStatus> {
  const response = await axiosInstance.get<PaymentIntentStatus>(
    `/api/bazaar/payments/intent/${paymentIntentId}`
  );
  return response.data;
}

/**
 * Cancel a PaymentIntent
 */
export async function cancelPaymentIntent(orderId: string): Promise<{ success: boolean; message: string }> {
  const response = await axiosInstance.post<{ success: boolean; message: string }>(
    '/api/bazaar/payments/cancel-intent',
    { order_id: orderId }
  );
  return response.data;
}

/**
 * Create a refund (vendor only)
 */
export async function createRefund(
  orderId: string,
  amount?: number,
  reason?: string
): Promise<RefundResponse> {
  const response = await axiosInstance.post<RefundResponse>(
    '/api/bazaar/payments/refund',
    { order_id: orderId, amount, reason }
  );
  return response.data;
}

// ============================================================================
// EXPORT API OBJECT
// ============================================================================

export const bazaarApi = {
  // Products
  products: {
    list: fetchProducts,
    get: fetchProduct,
    create: createProduct,
    update: updateProduct,
    delete: deleteProduct,
  },

  // Offerings
  offerings: {
    list: fetchOfferings,
    get: fetchOffering,
    create: createOffering,
    update: updateOffering,
    action: offeringAction,
    delete: deleteOffering,
  },

  // Orders
  orders: {
    list: fetchOrders,
    get: fetchOrder,
    create: createOrder,
    action: orderAction,
  },

  // Stalls
  stalls: {
    get: fetchStall,
  },

  // Vendor
  vendor: {
    orders: fetchVendorOrders,
    stats: fetchVendorStats,
  },

  // Payments
  payments: {
    createIntent: createPaymentIntent,
    getIntentStatus: getPaymentIntentStatus,
    cancelIntent: cancelPaymentIntent,
    refund: createRefund,
  },
};

export default bazaarApi;
