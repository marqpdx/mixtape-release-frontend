// components/bazaar/products/ProductSelector.tsx

"use client";

import { useMemo } from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  Badge,
  Select,
  Portal,
  Field,
  Spinner,
  createListCollection,
} from "@chakra-ui/react";
import { IconPackage } from "@tabler/icons-react";
import { useProducts } from "@mixtape/api/hooks/useBazaar";
import { Product } from "@mixtape/core/types/bazaarTypes";

interface ProductSelectorProps {
  sponsorType: string;
  sponsorId: string;
  selectedProductId: string | null;
  onSelect: (product: Product | null) => void;
  label?: string;
  placeholder?: string;
  isRequired?: boolean;
}

/**
 * Product Selector Component
 *
 * A dropdown to select a product when creating an Offering.
 * Only shows products owned by the same sponsor.
 */
export default function ProductSelector({
  sponsorType,
  sponsorId,
  selectedProductId,
  onSelect,
  label = "Attach Product (optional)",
  placeholder = "Select a product...",
  isRequired = false,
}: ProductSelectorProps) {
  const bazaarSponsorType = sponsorType === "user" ? "customuser" : sponsorType;

  // Fetch products for this sponsor
  const { products, isLoading, error } = useProducts({
    sponsor_type: bazaarSponsorType,
    sponsor_id: sponsorId,
  });

  // Active products only
  const activeProducts = useMemo(
    () => products.filter((p) => p.status === "active"),
    [products]
  );

  // Collection for select
  const productCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { label: "None (no product attached)", value: "" },
          ...activeProducts.map((p) => ({
            label: `${p.title} (${p.product_type})`,
            value: p.id,
          })),
        ],
      }),
    [activeProducts]
  );

  // Find selected product
  const selectedProduct = useMemo(
    () => activeProducts.find((p) => p.id === selectedProductId) || null,
    [activeProducts, selectedProductId]
  );

  // Handle selection change
  const handleChange = (value: string[]) => {
    const productId = value[0] || "";
    if (!productId) {
      onSelect(null);
    } else {
      const product = activeProducts.find((p) => p.id === productId);
      onSelect(product || null);
    }
  };

  if (isLoading) {
    return (
      <Field.Root>
        <Field.Label>{label}</Field.Label>
        <HStack>
          <Spinner size="sm" />
          <Text fontSize="sm" color="gray.500">
            Loading products...
          </Text>
        </HStack>
      </Field.Root>
    );
  }

  if (error) {
    return (
      <Field.Root>
        <Field.Label>{label}</Field.Label>
        <Text fontSize="sm" color="red.500">
          Error loading products
        </Text>
      </Field.Root>
    );
  }

  return (
    <VStack align="stretch" gap={2}>
      <Field.Root required={isRequired}>
        <Field.Label>{label}</Field.Label>
        <Select.Root
          collection={productCollection}
          value={selectedProductId ? [selectedProductId] : [""]}
          onValueChange={({ value }) => handleChange(value)}
        >
          <Select.HiddenSelect />
          <Select.Control>
            <Select.Trigger>
              <Select.ValueText placeholder={placeholder} />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator />
              <Select.ClearTrigger />
            </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content>
                {productCollection.items.map((item) => (
                  <Select.Item item={item} key={item.value}>
                    {item.value === "" ? (
                      <Text color="gray.500">{item.label}</Text>
                    ) : (
                      <HStack>
                        <IconPackage size={14} />
                        <Text>{item.label}</Text>
                      </HStack>
                    )}
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>
      </Field.Root>

      {/* Show selected product info */}
      {selectedProduct && (
        <Box
          p={3}
          bg="gray.50"
          borderRadius="md"
          borderWidth="1px"
          borderColor="gray.200"
        >
          <HStack gap={3}>
            <IconPackage size={20} color="gray" />
            <VStack align="start" gap={0}>
              <HStack>
                <Text fontWeight="medium" fontSize="sm">
                  {selectedProduct.title}
                </Text>
                <Badge size="sm">{selectedProduct.product_type}</Badge>
              </HStack>
              {selectedProduct.summary && (
                <Text fontSize="xs" color="gray.600" lineClamp={1}>
                  {selectedProduct.summary}
                </Text>
              )}
            </VStack>
          </HStack>
        </Box>
      )}

      {activeProducts.length === 0 && (
        <Text fontSize="xs" color="gray.500">
          No products available. Create a product first to attach it to offerings.
        </Text>
      )}
    </VStack>
  );
}
