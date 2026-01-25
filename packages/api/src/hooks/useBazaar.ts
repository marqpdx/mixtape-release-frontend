// packages/api/src/hooks/useBazaar.ts

/**
 * Bazaar React Query Hooks
 *
 * Hooks for the Bazaar marketplace system with caching and mutations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  fetchProducts,
  fetchProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  fetchOfferings,
  fetchOffering,
  createOffering,
  updateOffering,
  offeringAction,
  deleteOffering,
  fetchOrders,
  fetchOrder,
  createOrder,
  orderAction,
  fetchStall,
  fetchVendorOrders,
  fetchVendorStats,
  createPaymentIntent,
  getPaymentIntentStatus,
  cancelPaymentIntent,
  createRefund,
} from '../clients/bazaar/bazaarApi';
import {
  Product,
  ProductCreateFormData,
  ProductUpdateFormData,
  ProductFilters,
  Offering,
  OfferingCreateFormData,
  OfferingUpdateFormData,
  OfferingActionData,
  OfferingFilters,
  Order,
  OrderCreateFormData,
  OrderActionData,
  OrderFilters,
  Stall,
  VendorStats,
  PaymentIntentResponse,
} from '@mixtape/core/types/bazaarTypes';

// ============================================================================
// QUERY KEY FACTORIES
// ============================================================================

export const bazaarQueryKeys = {
  // Products
  products: {
    all: ['bazaar', 'products'] as const,
    lists: () => [...bazaarQueryKeys.products.all, 'list'] as const,
    list: (filters: ProductFilters = {}) =>
      [...bazaarQueryKeys.products.lists(), filters] as const,
    details: () => [...bazaarQueryKeys.products.all, 'detail'] as const,
    detail: (id: string) => [...bazaarQueryKeys.products.details(), id] as const,
  },

  // Offerings
  offerings: {
    all: ['bazaar', 'offerings'] as const,
    lists: () => [...bazaarQueryKeys.offerings.all, 'list'] as const,
    list: (filters: OfferingFilters = {}) =>
      [...bazaarQueryKeys.offerings.lists(), filters] as const,
    details: () => [...bazaarQueryKeys.offerings.all, 'detail'] as const,
    detail: (id: string) => [...bazaarQueryKeys.offerings.details(), id] as const,
  },

  // Orders
  orders: {
    all: ['bazaar', 'orders'] as const,
    lists: () => [...bazaarQueryKeys.orders.all, 'list'] as const,
    list: (filters: OrderFilters = {}) =>
      [...bazaarQueryKeys.orders.lists(), filters] as const,
    details: () => [...bazaarQueryKeys.orders.all, 'detail'] as const,
    detail: (id: string) => [...bazaarQueryKeys.orders.details(), id] as const,
  },

  // Stalls
  stalls: {
    all: ['bazaar', 'stalls'] as const,
    detail: (sponsorType: string, sponsorId: string) =>
      [...bazaarQueryKeys.stalls.all, sponsorType, sponsorId] as const,
  },

  // Vendor
  vendor: {
    all: ['bazaar', 'vendor'] as const,
    orders: (filters: Omit<OrderFilters, 'view'> = {}) =>
      [...bazaarQueryKeys.vendor.all, 'orders', filters] as const,
    stats: () => [...bazaarQueryKeys.vendor.all, 'stats'] as const,
  },

  // Payments
  payments: {
    all: ['bazaar', 'payments'] as const,
    intent: (id: string) => [...bazaarQueryKeys.payments.all, 'intent', id] as const,
  },
};

// ============================================================================
// PRODUCT HOOKS
// ============================================================================

/**
 * Hook to fetch products with optional filters
 */
export const useProducts = (filters: ProductFilters = {}) => {
  const {
    data: products = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: bazaarQueryKeys.products.list(filters),
    queryFn: () => fetchProducts(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });

  return {
    products,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

/**
 * Hook to fetch a single product
 */
export const useProduct = (id: string | null) => {
  const {
    data: product = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: bazaarQueryKeys.products.detail(id || ''),
    queryFn: () => fetchProduct(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    product,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

/**
 * Hook for product mutations
 */
export const useProductMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: ProductCreateFormData) => createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bazaarQueryKeys.products.lists() });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductUpdateFormData }) =>
      updateProduct(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: bazaarQueryKeys.products.detail(id) });
      queryClient.invalidateQueries({ queryKey: bazaarQueryKeys.products.lists() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: bazaarQueryKeys.products.detail(id) });
      queryClient.invalidateQueries({ queryKey: bazaarQueryKeys.products.lists() });
    },
  });

  return {
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    isCreating: createMutation.status === 'pending',
    isUpdating: updateMutation.status === 'pending',
    isDeleting: deleteMutation.status === 'pending',
    createError: createMutation.error as Error | null,
    updateError: updateMutation.error as Error | null,
    deleteError: deleteMutation.error as Error | null,
  };
};

// ============================================================================
// OFFERING HOOKS
// ============================================================================

/**
 * Hook to fetch offerings with optional filters
 */
export const useOfferings = (filters: OfferingFilters = {}) => {
  const {
    data: offerings = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: bazaarQueryKeys.offerings.list(filters),
    queryFn: () => fetchOfferings(filters),
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Computed filtered lists
  const activeOfferings = useMemo(
    () => offerings.filter(o => o.status === 'active'),
    [offerings]
  );

  const draftOfferings = useMemo(
    () => offerings.filter(o => o.status === 'draft'),
    [offerings]
  );

  return {
    offerings,
    activeOfferings,
    draftOfferings,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

/**
 * Hook to fetch a single offering
 */
export const useOffering = (id: string | null) => {
  const {
    data: offering = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: bazaarQueryKeys.offerings.detail(id || ''),
    queryFn: () => fetchOffering(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    offering,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

/**
 * Hook for offering mutations
 */
export const useOfferingMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: OfferingCreateFormData) => createOffering(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bazaarQueryKeys.offerings.lists() });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: OfferingUpdateFormData }) =>
      updateOffering(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: bazaarQueryKeys.offerings.detail(id) });
      queryClient.invalidateQueries({ queryKey: bazaarQueryKeys.offerings.lists() });
    },
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: OfferingActionData }) =>
      offeringAction(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: bazaarQueryKeys.offerings.detail(id) });
      queryClient.invalidateQueries({ queryKey: bazaarQueryKeys.offerings.lists() });
      queryClient.invalidateQueries({ queryKey: bazaarQueryKeys.stalls.all });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteOffering(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: bazaarQueryKeys.offerings.detail(id) });
      queryClient.invalidateQueries({ queryKey: bazaarQueryKeys.offerings.lists() });
    },
  });

  return {
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    action: actionMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    isCreating: createMutation.status === 'pending',
    isUpdating: updateMutation.status === 'pending',
    isActioning: actionMutation.status === 'pending',
    isDeleting: deleteMutation.status === 'pending',
  };
};

// ============================================================================
// ORDER HOOKS
// ============================================================================

/**
 * Hook to fetch orders (buyer view by default)
 */
export const useOrders = (filters: OrderFilters = {}) => {
  const {
    data: orders = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: bazaarQueryKeys.orders.list(filters),
    queryFn: () => fetchOrders(filters),
    staleTime: 1 * 60 * 1000, // 1 minute (orders change more frequently)
    refetchOnWindowFocus: true,
  });

  // Computed filtered lists
  const pendingOrders = useMemo(
    () => orders.filter(o => o.status === 'pending'),
    [orders]
  );

  const activeOrders = useMemo(
    () => orders.filter(o => ['confirmed', 'fulfilling'].includes(o.status)),
    [orders]
  );

  const completedOrders = useMemo(
    () => orders.filter(o => ['delivered', 'completed'].includes(o.status)),
    [orders]
  );

  return {
    orders,
    pendingOrders,
    activeOrders,
    completedOrders,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

/**
 * Hook to fetch a single order
 */
export const useOrder = (id: string | null) => {
  const {
    data: order = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: bazaarQueryKeys.orders.detail(id || ''),
    queryFn: () => fetchOrder(id!),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  return {
    order,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

/**
 * Hook for order mutations
 */
export const useOrderMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: OrderCreateFormData) => createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bazaarQueryKeys.orders.lists() });
    },
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: OrderActionData }) =>
      orderAction(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: bazaarQueryKeys.orders.detail(id) });
      queryClient.invalidateQueries({ queryKey: bazaarQueryKeys.orders.lists() });
      queryClient.invalidateQueries({ queryKey: bazaarQueryKeys.vendor.orders() });
      queryClient.invalidateQueries({ queryKey: bazaarQueryKeys.vendor.stats() });
    },
  });

  return {
    create: createMutation.mutateAsync,
    action: actionMutation.mutateAsync,
    isCreating: createMutation.status === 'pending',
    isActioning: actionMutation.status === 'pending',
    createError: createMutation.error as Error | null,
    actionError: actionMutation.error as Error | null,
  };
};

// ============================================================================
// STALL HOOKS
// ============================================================================

/**
 * Hook to fetch a stall (virtual vendor storefront)
 */
export const useStall = (sponsorType: string | null, sponsorId: string | null) => {
  const {
    data: stall = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: bazaarQueryKeys.stalls.detail(sponsorType || '', sponsorId || ''),
    queryFn: () => fetchStall(sponsorType!, sponsorId!),
    enabled: !!sponsorType && !!sponsorId,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    stall,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

// ============================================================================
// VENDOR HOOKS
// ============================================================================

/**
 * Hook to fetch vendor orders (orders for my offerings)
 */
export const useVendorOrders = (filters: Omit<OrderFilters, 'view'> = {}) => {
  const {
    data: orders = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: bazaarQueryKeys.vendor.orders(filters),
    queryFn: () => fetchVendorOrders(filters),
    staleTime: 1 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  // Computed filtered lists
  const needsAttention = useMemo(
    () => orders.filter(o => ['pending', 'confirmed', 'fulfilling'].includes(o.status)),
    [orders]
  );

  return {
    orders,
    needsAttention,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

/**
 * Hook to fetch vendor statistics
 */
export const useVendorStats = () => {
  const {
    data: stats = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: bazaarQueryKeys.vendor.stats(),
    queryFn: () => fetchVendorStats(),
    staleTime: 1 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  return {
    stats,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

// ============================================================================
// PAYMENT HOOKS
// ============================================================================

/**
 * Hook for payment mutations
 */
export const usePaymentMutations = () => {
  const queryClient = useQueryClient();

  const createIntentMutation = useMutation({
    mutationFn: (orderId: string) => createPaymentIntent(orderId),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: bazaarQueryKeys.orders.detail(orderId) });
    },
  });

  const cancelIntentMutation = useMutation({
    mutationFn: (orderId: string) => cancelPaymentIntent(orderId),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: bazaarQueryKeys.orders.detail(orderId) });
    },
  });

  const refundMutation = useMutation({
    mutationFn: ({
      orderId,
      amount,
      reason,
    }: {
      orderId: string;
      amount?: number;
      reason?: string;
    }) => createRefund(orderId, amount, reason),
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: bazaarQueryKeys.orders.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: bazaarQueryKeys.orders.lists() });
    },
  });

  return {
    createIntent: createIntentMutation.mutateAsync,
    cancelIntent: cancelIntentMutation.mutateAsync,
    refund: refundMutation.mutateAsync,
    isCreatingIntent: createIntentMutation.status === 'pending',
    isCancellingIntent: cancelIntentMutation.status === 'pending',
    isRefunding: refundMutation.status === 'pending',
    intentData: createIntentMutation.data as PaymentIntentResponse | undefined,
  };
};

/**
 * Hook to poll payment intent status
 */
export const usePaymentIntentStatus = (paymentIntentId: string | null) => {
  const {
    data: status = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: bazaarQueryKeys.payments.intent(paymentIntentId || ''),
    queryFn: () => getPaymentIntentStatus(paymentIntentId!),
    enabled: !!paymentIntentId,
    staleTime: 5 * 1000, // 5 seconds for payment status
    refetchInterval: 3000, // Poll every 3 seconds while payment is processing
    refetchOnWindowFocus: true,
  });

  return {
    status,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Utility hook to invalidate bazaar queries
 */
export const useInvalidateBazaar = () => {
  const queryClient = useQueryClient();

  return {
    invalidateProducts: () =>
      queryClient.invalidateQueries({ queryKey: bazaarQueryKeys.products.all }),
    invalidateOfferings: () =>
      queryClient.invalidateQueries({ queryKey: bazaarQueryKeys.offerings.all }),
    invalidateOrders: () =>
      queryClient.invalidateQueries({ queryKey: bazaarQueryKeys.orders.all }),
    invalidateStalls: () =>
      queryClient.invalidateQueries({ queryKey: bazaarQueryKeys.stalls.all }),
    invalidateVendor: () =>
      queryClient.invalidateQueries({ queryKey: bazaarQueryKeys.vendor.all }),
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: ['bazaar'] }),
  };
};
