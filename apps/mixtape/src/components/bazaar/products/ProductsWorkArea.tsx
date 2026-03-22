// components/bazaar/products/ProductsWorkArea.tsx

"use client";

import { useState, useMemo } from "react";
import type { ChangeEvent } from "react";
import {
  Box,
  Button,
  Heading,
  HStack,
  Input,
  VStack,
  Text,
  Textarea,
  SimpleGrid,
  Badge,
  Card,
  IconButton,
  Select,
  Portal,
  Field,
  Spinner,
  createListCollection,
} from "@chakra-ui/react";
import { IconEdit, IconTrash, IconPlus, IconPackage } from "@tabler/icons-react";
import { useProducts, useProductMutations } from "@mixtape/api/hooks/useBazaar";
import {
  Product,
  ProductType,
  ProductCreateFormData,
} from "@mixtape/core/types/bazaarTypes";
import { Divider } from "@/components/common/Divider";

interface ProductsWorkAreaProps {
  sponsorType: string;
  sponsorId: string;
  sponsorTitle: string;
}

/**
 * Products Work Area
 *
 * Manage products (inventory items) for a sponsor (group/user).
 * Products can be referenced by multiple Offerings.
 */
export default function ProductsWorkArea({
  sponsorType,
  sponsorId,
  sponsorTitle,
}: ProductsWorkAreaProps) {
  const bazaarSponsorType = sponsorType === "user" ? "customuser" : sponsorType;

  // State
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [productType, setProductType] = useState<ProductType>("physical");
  const [requiresShipping, setRequiresShipping] = useState(false);

  // Fetch products
  const { products, isLoading, error, refetch } = useProducts({
    sponsor_type: bazaarSponsorType,
    sponsor_id: sponsorId,
  });

  // Mutations
  const {
    create,
    update,
    delete: deleteProduct,
    isCreating: isSaving,
    isDeleting,
  } = useProductMutations();

  // Selected product
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) || null,
    [products, selectedProductId]
  );

  // Product type collection for select
  const productTypeCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { label: "Physical", value: "physical" },
          { label: "Digital", value: "digital" },
          { label: "Service", value: "service" },
          { label: "Bundle", value: "bundle" },
        ],
      }),
    []
  );

  // Reset form
  const resetForm = () => {
    setTitle("");
    setSummary("");
    setDescription("");
    setProductType("physical");
    setRequiresShipping(false);
    setIsCreating(false);
    setIsEditing(false);
  };

  // Load product into form for editing
  const loadProductForEdit = (product: Product) => {
    setTitle(product.title);
    setSummary(product.summary);
    setDescription(product.description || "");
    setProductType(product.product_type);
    setRequiresShipping(product.requires_shipping);
    setSelectedProductId(product.id);
    setIsEditing(true);
    setIsCreating(false);
  };

  // Handle create
  const handleCreate = async () => {
    if (!title.trim()) return;

    try {
      const data: ProductCreateFormData = {
        title: title.trim(),
        summary: summary.trim(),
        description: description.trim() || undefined,
        product_type: productType,
        requires_shipping: requiresShipping,
        sponsor_type: bazaarSponsorType,
        sponsor_id: sponsorId,
      };

      const newProduct = await create(data);
      setSelectedProductId(newProduct.id);
      resetForm();
      refetch();
    } catch (err) {
      console.error("Failed to create product:", err);
    }
  };

  // Handle update
  const handleUpdate = async () => {
    if (!selectedProductId || !title.trim()) return;

    try {
      await update({
        id: selectedProductId,
        data: {
          title: title.trim(),
          summary: summary.trim(),
          description: description.trim() || undefined,
          product_type: productType,
          requires_shipping: requiresShipping,
        },
      });
      resetForm();
      refetch();
    } catch (err) {
      console.error("Failed to update product:", err);
    }
  };

  // Handle delete
  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await deleteProduct(productId);
      if (selectedProductId === productId) {
        setSelectedProductId(null);
        resetForm();
      }
      refetch();
    } catch (err) {
      console.error("Failed to delete product:", err);
    }
  };

  // Start creating
  const startCreating = () => {
    resetForm();
    setIsCreating(true);
    setSelectedProductId(null);
  };

  return (
    <VStack align="stretch" gap={8}>
      {/* Header */}
      <Box>
        <Heading size="md" mb={2}>
          <HStack>
            <IconPackage size={24} />
            <Text>Products</Text>
          </HStack>
        </Heading>
        <Text fontSize="sm" color="gray.600">
          Manage reusable products for {sponsorTitle}. Products can be attached to multiple offerings.
        </Text>
      </Box>

      <Divider />

      {/* Products List */}
      <Box>
        <HStack justify="space-between" mb={4}>
          <Heading size="sm">Your Products</Heading>
          <Button
            size="sm"
            colorScheme="blue"
            onClick={startCreating}
          >
            <IconPlus size={16} />
            New Product
          </Button>
        </HStack>

        {isLoading && (
          <HStack>
            <Spinner size="sm" />
            <Text fontSize="sm" color="gray.600">
              Loading products...
            </Text>
          </HStack>
        )}

        {error && (
          <Text fontSize="sm" color="red.500">
            Error loading products: {error.message}
          </Text>
        )}

        {!isLoading && products.length === 0 && (
          <Text fontSize="sm" color="gray.500">
            No products yet. Create one to get started.
          </Text>
        )}

        {!isLoading && products.length > 0 && (
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            {products.map((product) => (
              <Card.Root
                key={product.id}
                variant="outline"
                borderColor={selectedProductId === product.id ? "blue.400" : undefined}
                cursor="pointer"
                onClick={() => {
                  setSelectedProductId(product.id);
                  setIsCreating(false);
                  setIsEditing(false);
                }}
                _hover={{ shadow: "sm" }}
              >
                <Card.Body>
                  <HStack justify="space-between" align="start">
                    <VStack align="start" gap={1}>
                      <HStack>
                        <Text fontWeight="medium">{product.title}</Text>
                        <Badge size="sm" colorPalette={product.status === "active" ? "green" : "gray"}>
                          {product.status}
                        </Badge>
                      </HStack>
                      <Badge variant="outline" size="sm">
                        {product.product_type}
                      </Badge>
                      {product.summary && (
                        <Text fontSize="sm" color="gray.600" lineClamp={2}>
                          {product.summary}
                        </Text>
                      )}
                    </VStack>
                    <HStack>
                      <IconButton
                        aria-label="Edit product"
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          loadProductForEdit(product);
                        }}
                      >
                        <IconEdit size={16} />
                      </IconButton>
                      <IconButton
                        aria-label="Delete product"
                        size="sm"
                        variant="ghost"
                        colorPalette="red"
                        loading={isDeleting}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(product.id);
                        }}
                      >
                        <IconTrash size={16} />
                      </IconButton>
                    </HStack>
                  </HStack>
                </Card.Body>
              </Card.Root>
            ))}
          </SimpleGrid>
        )}
      </Box>

      {/* Create/Edit Form */}
      {(isCreating || isEditing) && (
        <>
          <Divider />
          <Box>
            <Heading size="sm" mb={4}>
              {isCreating ? "Create New Product" : "Edit Product"}
            </Heading>

            <VStack align="stretch" gap={4}>
              <Field.Root>
                <Field.Label>Title *</Field.Label>
                <Input
                  value={title}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                  placeholder="Product name"
                />
              </Field.Root>

              <Field.Root>
                <Field.Label>Summary</Field.Label>
                <Input
                  value={summary}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSummary(e.target.value)}
                  placeholder="Short description"
                />
              </Field.Root>

              <Field.Root>
                <Field.Label>Description</Field.Label>
                <Textarea
                  value={description}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                  placeholder="Detailed description (optional)"
                  rows={4}
                />
              </Field.Root>

              <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                <Field.Root>
                  <Field.Label>Product Type</Field.Label>
                  <Select.Root
                    collection={productTypeCollection}
                    value={[productType]}
                    onValueChange={({ value }) => setProductType(value[0] as ProductType)}
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText placeholder="Select type" />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Portal>
                      <Select.Positioner>
                        <Select.Content>
                          {productTypeCollection.items.map((item) => (
                            <Select.Item item={item} key={item.value}>
                              {item.label}
                              <Select.ItemIndicator />
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Portal>
                  </Select.Root>
                </Field.Root>

                <Field.Root>
                  <Field.Label>Requires Shipping?</Field.Label>
                  <Select.Root
                    collection={createListCollection({
                      items: [
                        { label: "No", value: "false" },
                        { label: "Yes", value: "true" },
                      ],
                    })}
                    value={[requiresShipping.toString()]}
                    onValueChange={({ value }) => setRequiresShipping(value[0] === "true")}
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Portal>
                      <Select.Positioner>
                        <Select.Content>
                          <Select.Item item={{ label: "No", value: "false" }}>
                            No
                            <Select.ItemIndicator />
                          </Select.Item>
                          <Select.Item item={{ label: "Yes", value: "true" }}>
                            Yes
                            <Select.ItemIndicator />
                          </Select.Item>
                        </Select.Content>
                      </Select.Positioner>
                    </Portal>
                  </Select.Root>
                </Field.Root>
              </SimpleGrid>

              <HStack justify="flex-start" pt={2}>
                <Button
                  colorPalette={isCreating ? "green" : "blue"}
                  onClick={isCreating ? handleCreate : handleUpdate}
                  loading={isSaving}
                  disabled={!title.trim()}
                >
                  {isCreating ? "Create Product" : "Save Changes"}
                </Button>
                <Button variant="ghost" onClick={resetForm}>
                  Cancel
                </Button>
              </HStack>
            </VStack>
          </Box>
        </>
      )}

      {/* Selected Product Detail */}
      {selectedProduct && !isEditing && !isCreating && (
        <>
          <Divider />
          <Box>
            <HStack justify="space-between" mb={4}>
              <Heading size="sm">Product Details</Heading>
              <Button
                size="sm"
                variant="outline"
                onClick={() => loadProductForEdit(selectedProduct)}
              >
                <IconEdit size={16} />
                Edit
              </Button>
            </HStack>

            <VStack align="start" gap={3}>
              <Box>
                <Text fontSize="sm" color="gray.500">
                  Title
                </Text>
                <Text fontWeight="medium">{selectedProduct.title}</Text>
              </Box>

              <HStack gap={4}>
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    Type
                  </Text>
                  <Badge>{selectedProduct.product_type}</Badge>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    Status
                  </Text>
                  <Badge colorPalette={selectedProduct.status === "active" ? "green" : "gray"}>
                    {selectedProduct.status}
                  </Badge>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    Shipping
                  </Text>
                  <Text>{selectedProduct.requires_shipping ? "Required" : "Not required"}</Text>
                </Box>
              </HStack>

              {selectedProduct.summary && (
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    Summary
                  </Text>
                  <Text>{selectedProduct.summary}</Text>
                </Box>
              )}

              {selectedProduct.description && (
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    Description
                  </Text>
                  <Text whiteSpace="pre-wrap">{selectedProduct.description}</Text>
                </Box>
              )}

              <Box>
                <Text fontSize="sm" color="gray.500">
                  Created
                </Text>
                <Text fontSize="sm">
                  {new Date(selectedProduct.created_at).toLocaleDateString()}
                </Text>
              </Box>
            </VStack>
          </Box>
        </>
      )}
    </VStack>
  );
}
