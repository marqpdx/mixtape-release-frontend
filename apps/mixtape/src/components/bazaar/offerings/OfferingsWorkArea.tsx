// components/bazaar/offerings/OfferingsWorkArea.tsx

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
  Switch,
  createListCollection,
} from "@chakra-ui/react";
import {
  IconEdit,
  IconTrash,
  IconPlus,
  IconTag,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react";
import { useOfferings, useOfferingMutations } from "@mixtape/api/hooks/useBazaar";
import {
  Offering,
  OfferingShape,
  OfferingCreateFormData,
  formatPrice,
  getOfferingShapeLabel,
  toCents,
} from "@mixtape/core/types/bazaarTypes";
import { Divider } from "@/components/common/Divider";
import ProductSelector from "../products/ProductSelector";

interface OfferingsWorkAreaProps {
  sponsorType: string;
  sponsorId: string;
  sponsorTitle: string;
}
type PriceType = "fixed" | "suggested" | "minimum";

/**
 * Offerings Work Area
 *
 * Manage offerings (sellable items) for a sponsor (group/user).
 */
export default function OfferingsWorkArea({
  sponsorType,
  sponsorId,
  sponsorTitle,
}: OfferingsWorkAreaProps) {
  // State
  const [selectedOfferingId, setSelectedOfferingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [shape, setShape] = useState<OfferingShape>("service");
  const [priceInput, setPriceInput] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [isPublished, setIsPublished] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; title: string } | null>(null);

  // Fetch offerings
  const { offerings, isLoading, error, refetch } = useOfferings({
    sponsor_type: sponsorType,
    sponsor_id: sponsorId,
  });

  // Mutations
  const {
    create,
    update,
    delete: deleteOffering,
    isCreating: isSaving,
    isDeleting,
  } = useOfferingMutations();

  // Selected offering
  const selectedOffering = useMemo(
    () => offerings.find((o) => o.id === selectedOfferingId) || null,
    [offerings, selectedOfferingId]
  );

  // Shape collection for select
  const shapeCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { label: "Service", value: "service" },
          { label: "Event", value: "event" },
          { label: "Program", value: "program" },
          { label: "Product", value: "product" },
        ],
      }),
    []
  );

  // Visibility collection

  // Currency collection
  const currencyCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { label: "USD ($)", value: "USD" },
          { label: "EUR", value: "EUR" },
          { label: "GBP", value: "GBP" },
        ],
      }),
    []
  );

  const priceTypeCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { label: "Fixed price", value: "fixed" },
          { label: "Suggested price", value: "suggested" },
          { label: "Minimum price", value: "minimum" },
        ],
      }),
    []
  );

  const [priceType, setPriceType] = useState<PriceType>("fixed");

  // Reset form
  const resetForm = () => {
    setTitle("");
    setSummary("");
    setDescription("");
    setShape("service");
    setPriceInput("");
    setCurrency("USD");
    setPriceType("fixed");
    setSelectedProduct(null);
    setIsPublished(false);
    setIsCreating(false);
    setIsEditing(false);
  };

  // Load offering into form for editing
  const loadOfferingForEdit = (offering: Offering) => {
    setTitle(offering.title);
    setSummary(offering.summary);
    setDescription(offering.description || "");
    setShape(offering.shape);
    setPriceType("fixed");
    setPriceInput((offering.price_amount / 100).toFixed(2)); // Convert cents to dollars
    setCurrency(offering.currency);
    setSelectedProduct(
      offering.asset_id && offering.asset_title
        ? { id: offering.asset_id, title: offering.asset_title }
        : null
    );
    setIsPublished(offering.status === "published");
    setSelectedOfferingId(offering.id);
    setIsEditing(true);
    setIsCreating(false);
  };

  // Handle create
  const handleCreate = async () => {
    if (!title.trim()) return;

    try {
      const priceInCents = toCents(parseFloat(priceInput) || 0);

      const data: OfferingCreateFormData = {
        title: title.trim(),
        summary: summary.trim(),
        description: description.trim() || undefined,
        shape,
        price_amount: priceInCents,
        currency,
        asset_id: selectedProduct?.id,
        sponsor_type: sponsorType,
        sponsor_id: sponsorId,
        status: isPublished ? "published" : "draft",
      };

      const newOffering = await create(data);
      setSelectedOfferingId(newOffering.id);
      resetForm();
      refetch();
    } catch (err) {
      console.error("Failed to create offering:", err);
    }
  };

  // Handle update
  const handleUpdate = async () => {
    if (!selectedOfferingId || !title.trim()) return;

    try {
      const priceInCents = toCents(parseFloat(priceInput) || 0);

      await update({
        id: selectedOfferingId,
        data: {
          title: title.trim(),
          summary: summary.trim(),
          description: description.trim() || undefined,
          shape,
          price_amount: priceInCents,
          currency,
          asset_id: selectedProduct?.id,
          status: isPublished ? "published" : "draft",
        },
      });
      resetForm();
      refetch();
    } catch (err) {
      console.error("Failed to update offering:", err);
    }
  };

  // Handle delete
  const handleDelete = async (offeringId: string) => {
    if (!confirm("Are you sure you want to delete this offering?")) return;

    try {
      await deleteOffering(offeringId);
      if (selectedOfferingId === offeringId) {
        setSelectedOfferingId(null);
        resetForm();
      }
      refetch();
    } catch (err) {
      console.error("Failed to delete offering:", err);
    }
  };

  // Start creating
  const startCreating = () => {
    resetForm();
    setIsCreating(true);
    setSelectedOfferingId(null);
  };

  return (
    <VStack align="stretch" gap={8}>
      {/* Header */}
      <Box>
        <Heading size="md" mb={2}>
          <HStack>
            <IconTag size={24} />
            <Text>Offerings</Text>
          </HStack>
        </Heading>
        <Text fontSize="sm" color="gray.600">
          Manage what you sell for {sponsorTitle}. Offerings can be items, subscriptions, donations, tickets, or services.
        </Text>
      </Box>

      <Divider />

      {/* Offerings List */}
      <Box>
        <HStack justify="space-between" mb={4}>
          <Heading size="sm">Your Offerings</Heading>
          <Button
            size="sm"
            colorPalette="blue"
            onClick={startCreating}
          >
            <IconPlus size={16} />
            New Offering
          </Button>
        </HStack>

        {isLoading && (
          <HStack>
            <Spinner size="sm" />
            <Text fontSize="sm" color="gray.600">
              Loading offerings...
            </Text>
          </HStack>
        )}

        {error && (
          <Text fontSize="sm" color="red.500">
            Error loading offerings: {error.message}
          </Text>
        )}

        {!isLoading && offerings.length === 0 && (
          <Text fontSize="sm" color="gray.500">
            No offerings yet. Create one to start selling.
          </Text>
        )}

        {!isLoading && offerings.length > 0 && (
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            {offerings.map((offering) => (
              <Card.Root
                key={offering.id}
                variant="outline"
                borderColor={selectedOfferingId === offering.id ? "blue.400" : undefined}
                cursor="pointer"
                onClick={() => {
                  setSelectedOfferingId(offering.id);
                  setIsCreating(false);
                  setIsEditing(false);
                }}
                _hover={{ shadow: "sm" }}
              >
                <Card.Body>
                  <HStack justify="space-between" align="start">
                    <VStack align="start" gap={1}>
                      <HStack>
                        <Text fontWeight="medium">{offering.title}</Text>
                        <Badge
                          size="sm"
                          colorPalette={offering.status === "published" ? "green" : "gray"}
                        >
                          {offering.status === "published" ? (
                            <HStack gap={1}>
                              <IconEye size={12} />
                              <Text>Published</Text>
                            </HStack>
                          ) : (
                            <HStack gap={1}>
                              <IconEyeOff size={12} />
                              <Text>Draft</Text>
                            </HStack>
                          )}
                        </Badge>
                      </HStack>
                      <HStack gap={2}>
                        <Badge variant="outline" size="sm">
                          {getOfferingShapeLabel(offering.shape)}
                        </Badge>
                        <Text fontWeight="bold" fontSize="sm">
                          {offering.is_free || offering.effective_price === 0
                            ? "FREE"
                            : formatPrice(offering.effective_price, offering.currency)}
                        </Text>
                      </HStack>
                      {offering.summary && (
                        <Text fontSize="sm" color="gray.600" lineClamp={2}>
                          {offering.summary}
                        </Text>
                      )}
                    </VStack>
                    <HStack>
                      <IconButton
                        aria-label="Edit offering"
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          loadOfferingForEdit(offering);
                        }}
                      >
                        <IconEdit size={16} />
                      </IconButton>
                      <IconButton
                        aria-label="Delete offering"
                        size="sm"
                        variant="ghost"
                        colorPalette="red"
                        loading={isDeleting}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(offering.id);
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
              {isCreating ? "Create New Offering" : "Edit Offering"}
            </Heading>

            <VStack align="stretch" gap={4}>
              <Field.Root>
                <Field.Label>Title *</Field.Label>
                <Input
                  value={title}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                  placeholder="Offering name"
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
                  <Field.Label>Type</Field.Label>
                  <Select.Root
                    collection={shapeCollection}
                    value={[shape]}
                    onValueChange={({ value }) => setShape(value[0] as OfferingShape)}
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
                          {shapeCollection.items.map((item) => (
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
                  <Field.Label>Pricing Model</Field.Label>
                  <Select.Root
                    collection={priceTypeCollection}
                    value={[priceType]}
                    onValueChange={({ value }) => setPriceType(value[0] as PriceType)}
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText placeholder="Select pricing" />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Portal>
                      <Select.Positioner>
                        <Select.Content>
                          {priceTypeCollection.items.map((item) => (
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
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                <Field.Root>
                  <Field.Label>
                    {priceType === "fixed"
                      ? "Price"
                      : priceType === "suggested"
                      ? "Suggested Price"
                      : "Minimum Price"}
                  </Field.Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={priceInput}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setPriceInput(e.target.value)}
                    placeholder="0.00"
                  />
                  <Field.HelperText>Enter price in dollars (e.g., 9.99)</Field.HelperText>
                </Field.Root>

                <Field.Root>
                  <Field.Label>Currency</Field.Label>
                  <Select.Root
                    collection={currencyCollection}
                    value={[currency]}
                    onValueChange={({ value }) => setCurrency(value[0])}
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
                          {currencyCollection.items.map((item) => (
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
              </SimpleGrid>

              {/* Product Selector */}
              <ProductSelector
                sponsorType={sponsorType}
                sponsorId={sponsorId}
                selectedProductId={selectedProduct?.id || null}
                onSelect={setSelectedProduct}
              />

              {/* Publish toggle */}
              <Field.Root>
                <HStack justify="space-between">
                  <Box>
                    <Field.Label mb={0}>Publish Offering</Field.Label>
                    <Text fontSize="xs" color="gray.500">
                      Published offerings are visible in the catalog
                    </Text>
                  </Box>
                  <Switch.Root
                    checked={isPublished}
                    onCheckedChange={({ checked }) => setIsPublished(checked)}
                  >
                    <Switch.HiddenInput />
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch.Root>
                </HStack>
              </Field.Root>

              <HStack justify="flex-start" pt={2}>
                <Button
                  colorPalette={isCreating ? "green" : "blue"}
                  onClick={isCreating ? handleCreate : handleUpdate}
                  loading={isSaving}
                  disabled={!title.trim()}
                >
                  {isCreating ? "Create Offering" : "Save Changes"}
                </Button>
                <Button variant="ghost" onClick={resetForm}>
                  Cancel
                </Button>
              </HStack>
            </VStack>
          </Box>
        </>
      )}

      {/* Selected Offering Detail */}
      {selectedOffering && !isEditing && !isCreating && (
        <>
          <Divider />
          <Box>
            <HStack justify="space-between" mb={4}>
              <Heading size="sm">Offering Details</Heading>
              <Button
                size="sm"
                variant="outline"
                onClick={() => loadOfferingForEdit(selectedOffering)}
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
                <Text fontWeight="medium">{selectedOffering.title}</Text>
              </Box>

              <HStack gap={4} flexWrap="wrap">
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    Type
                  </Text>
                  <Badge>{getOfferingShapeLabel(selectedOffering.shape)}</Badge>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    Status
                  </Text>
                  <Badge colorPalette={selectedOffering.status === "published" ? "green" : "gray"}>
                    {selectedOffering.status}
                  </Badge>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    Price
                  </Text>
                  <Text fontWeight="bold">
                    {selectedOffering.is_free || selectedOffering.effective_price === 0
                      ? "FREE"
                      : formatPrice(selectedOffering.effective_price, selectedOffering.currency)}
                  </Text>
                </Box>
              </HStack>

              {selectedOffering.asset_title && (
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    Attached Product
                  </Text>
                  <Badge variant="outline">{selectedOffering.asset_title}</Badge>
                </Box>
              )}

              {selectedOffering.summary && (
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    Summary
                  </Text>
                  <Text>{selectedOffering.summary}</Text>
                </Box>
              )}

              {selectedOffering.description && (
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    Description
                  </Text>
                  <Text whiteSpace="pre-wrap">{selectedOffering.description}</Text>
                </Box>
              )}

              <Box>
                <Text fontSize="sm" color="gray.500">
                  Created
                </Text>
                <Text fontSize="sm">
                  {new Date(selectedOffering.created_at).toLocaleDateString()}
                </Text>
              </Box>
            </VStack>
          </Box>
        </>
      )}
    </VStack>
  );
}
