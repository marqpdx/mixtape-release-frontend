// src/components/common/UniversalDataTable.tsx

"use client";

import {
  Box,
  Heading,
  Text,
  HStack,
  VStack,
  IconButton,
  Button,
  Avatar,
} from "@chakra-ui/react";
import { AvatarGroup } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import {
  createColumnHelper,
  flexRender,
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  SortingState
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { IconEdit, IconEye, IconPlus } from "@tabler/icons-react";
import { ReactNode, useState } from "react";

interface BaseItem {
  id: string | number;
  slug?: string;
  title?: string;
  name?: string;
  description?: string;
  profile_image?: string | null;
  avatar?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface TableAction {
  label: string;
  icon?: ReactNode;
  onClick: (item: any) => void;
  variant?: "ghost" | "outline" | "solid";
  colorScheme?: string;
  showIf?: (item: any) => boolean;
}

interface UniversalDataTableProps<T extends BaseItem> {
  // Data - now passed in instead of fetched
  data: T[];
  title: string;

  // Loading and Error States
  isLoading?: boolean;
  error?: string | null;

  // Layout and Display
  columns?: ColumnDef<T>[];
  showAvatar?: boolean;
  avatarFallbackIcon?: ReactNode;
  emptyStateMessage?: string;
  emptyStateSubtitle?: string;

  // Actions
  actions?: TableAction[];
  onRowClick?: (item: T) => void;
  showCreateButton?: boolean;
  onCreateClick?: () => void;
  createButtonLabel?: string;
  setActiveSection?: (section: string) => void;

  // Permissions
  canEdit?: (item: T) => boolean;
  canView?: (item: T) => boolean;

  // Table Configuration
  pageSize?: number;
  defaultSort?: { field: string; order: "asc" | "desc" };

  // Custom Renderers
  renderTitle?: (item: T) => ReactNode;
  renderDescription?: (item: T) => ReactNode;
  renderMetadata?: (item: T) => ReactNode;
  renderAvatar?: (item: T) => ReactNode;

  // Navigation base path (optional, for default edit/view actions)
  basePath?: string;
}

export default function UniversalDataTable<T extends BaseItem>({
  data,
  title,
  isLoading = false,
  error = null,
  columns,
  showAvatar = true,
  avatarFallbackIcon,
  emptyStateMessage,
  emptyStateSubtitle,
  actions = [],
  onRowClick,
  showCreateButton = false,
  onCreateClick,
  createButtonLabel = "Create New",
  canEdit = () => false,
  canView = () => true,
  pageSize = 10,
  defaultSort = { field: "item_info", order: "desc" },
  renderTitle,
  renderDescription,
  renderMetadata,
  renderAvatar,
  basePath,
}: UniversalDataTableProps<T>) {
  const router = useRouter();
  const columnHelper = createColumnHelper<T>();
  const [sorting, setSorting] = useState<SortingState>([
    { id: defaultSort.field, desc: defaultSort.order === "desc" }
  ]);

  const bgHover = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const emptyStateBg = useColorModeValue("gray.50", "gray.800");
  const headerBg = useColorModeValue("gray.50", "gray.700");
  const cardBg = useColorModeValue("white", "gray.800");
  const textPrimary = useColorModeValue("gray.900", "white");
  const textSecondary = useColorModeValue("gray.600", "gray.300");
  const headerText = useColorModeValue("gray.700", "gray.200");

  // TODO turn this into a universal utility function
  const safeSrc = (value?: string | null): string | undefined => {
    if (!value) return undefined;
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  };

  // Default columns if none provided
  const defaultColumns = [
    columnHelper.display({
      id: "item_info",
      header: title,
      cell: ({ row }) => {
        const item = row.original;
        const itemTitle = item.title || item.name || `Item ${item.id}`;
        const itemDescription = item.description || "";

        const handleRowClick = () => {
          if (onRowClick) {
            onRowClick(item);
          } else if (item.slug && canView(item) && basePath) {
            router.push(`${basePath}/${item.slug}/show`);
          }
        };

        return (
          <HStack
            data-testid="group-card"
            gap={4}
            py={2}
            cursor={onRowClick || (canView(item) && basePath) ? "pointer" : "default"}
            onClick={handleRowClick}
            _hover={onRowClick || (canView(item) && basePath) ? { bg: bgHover } : {}}
            rounded="md"
            px={3}
            mx={-3}
            transition="all 0.2s"
          >
            {/* Avatar Section */}
            {showAvatar && (
              <Box flexShrink={0}>
                {renderAvatar ? (
                  renderAvatar(item)
                ) : (
                  <AvatarGroup>
                    <Avatar.Root size="lg">
                      <Avatar.Image
                        src={safeSrc(item.profile_image) ?? safeSrc(item.avatar)}
                        alt={`${itemTitle} avatar`}
                      />
                      <Avatar.Fallback bg="green.100" color="green.700">
                        {avatarFallbackIcon || itemTitle.charAt(0).toUpperCase()}
                      </Avatar.Fallback>
                    </Avatar.Root>
                  </AvatarGroup>
                )}
              </Box>
            )}

            {/* Content Section */}
            <VStack align="start" gap={1} flex={1} minW={0}>
              <HStack justify="space-between" w="full">
                <Box flex={1} minW={0}>
                  {renderTitle ? (
                    renderTitle(item)
                  ) : (
                    <Text
                      fontWeight="semibold"
                      fontSize="md"
                      color={textPrimary}
                      _hover={{ color: "green.600" }}
                      transition="color 0.2s"
                      lineClamp={1}
                    >
                      {itemTitle}
                    </Text>
                  )}
                </Box>

                {/* Actions */}
                <HStack gap={1} flexShrink={0}>
                  {actions.map((action, index) => {
                    if (action.showIf && !action.showIf(item)) return null;

                    return (
                      <IconButton
                        key={index}
                        aria-label={action.label}
                        size="sm"
                        variant={action.variant || "ghost"}
                        colorScheme={action.colorScheme || "green"}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          action.onClick(item);
                        }}
                        title={action.label}
                      >
                        {action.icon}
                      </IconButton>
                    );
                  })}

                  {canEdit(item) && basePath && (
                    <IconButton
                      aria-label="Edit"
                      size="sm"
                      variant="ghost"
                      colorScheme="green"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        router.push(`${basePath}/${item.slug || item.id}/edit`);
                      }}
                      title="Edit"
                    >
                      <IconEdit size={16} />
                    </IconButton>
                  )}

                  {canView(item) && !onRowClick && basePath && (
                    <IconButton
                      aria-label="View"
                      size="sm"
                      variant="ghost"
                      colorScheme="blue"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        router.push(`${basePath}/${item.slug || item.id}/show`);
                      }}
                      title="View"
                    >
                      <IconEye size={16} />
                    </IconButton>
                  )}
                </HStack>
              </HStack>

              {/* Description */}
              {renderDescription ? (
                renderDescription(item)
              ) : (
                itemDescription && (
                  <Text
                    fontSize="sm"
                    color={textSecondary}
                    lineClamp={2}
                    wordBreak="break-word"
                  >
                    {itemDescription}
                  </Text>
                )
              )}

              {/* Metadata */}
              {renderMetadata ? (
                renderMetadata(item)
              ) : (
                item.created_at && (
                  <Text fontSize="xs" color="gray.400" mt={1}>
                    Created {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                )
              )}
            </VStack>
          </HStack>
        );
      },
    }),
  ];

  const tableColumns = columns || defaultColumns;

  // Initialize React Table with provided data
  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableSortingRemoval: false,
    enableMultiSort: false,
  });

  // Loading state
  if (isLoading) {
    return (
      <Box>
        {title && (
          <HStack justify="space-between" align="center" mb={6}>
            <Heading size="lg" color="green.600">
              {title}
            </Heading>
            {showCreateButton && onCreateClick && (
              <Button
                colorScheme="green"
                onClick={onCreateClick}
              >
                <IconPlus size={16} />
                {createButtonLabel}
              </Button>
            )}
          </HStack>
        )}

        <Box
          textAlign="center"
          py={16}
          border="1px solid"
          borderColor={borderColor}
          rounded="lg"
          bg={emptyStateBg}
        >
          <Text fontSize="lg" fontWeight="medium" color={textSecondary} mb={2}>
            {emptyStateMessage || "Loading..."}
          </Text>
          <Text color="gray.500">
            {emptyStateSubtitle || "Please wait while we fetch your data"}
          </Text>
        </Box>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box>
        {title && (
          <HStack justify="space-between" align="center" mb={6}>
            <Heading size="lg" color="green.600">
              {title}
            </Heading>
            {showCreateButton && onCreateClick && (
              <Button
                colorScheme="green"
                onClick={onCreateClick}
              >
                <IconPlus size={16} />
                {createButtonLabel}
              </Button>
            )}
          </HStack>
        )}

        <Box
          textAlign="center"
          py={16}
          border="1px solid"
          borderColor={borderColor}
          rounded="lg"
          bg={emptyStateBg}
        >
          <Text fontSize="lg" fontWeight="medium" color="red.500" mb={2}>
            {emptyStateMessage || "Error loading data"}
          </Text>
          <Text color="gray.500">
            {emptyStateSubtitle || error}
          </Text>
        </Box>
      </Box>
    );
  }

  // Empty state
  if (!data.length) {
    return (
      <Box>
        {title && (
          <HStack justify="space-between" align="center" mb={6}>
            <Heading size="lg" color="green.600">
              {title}
            </Heading>
            {showCreateButton && onCreateClick && (
              <Button
                colorScheme="green"
                onClick={onCreateClick}
              >
                <IconPlus size={16} />
                {createButtonLabel}
              </Button>
            )}
          </HStack>
        )}

        <Box
          textAlign="center"
          py={16}
          border="1px solid"
          borderColor={borderColor}
          rounded="lg"
          bg={emptyStateBg}
        >
          <Text fontSize="lg" fontWeight="medium" color={textSecondary} mb={2}>
            {emptyStateMessage || `No ${title.toLowerCase()} found`}
          </Text>
          <Text color="gray.500">
            {emptyStateSubtitle || `Create your first ${title.toLowerCase().slice(0, -1)} to get started`}
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {title && (
        <HStack justify="space-between" align="center" mb={6}>
          <Heading size="lg" color="green.600">
            {title} ({data.length})
          </Heading>
          {showCreateButton && onCreateClick && (
            <Button
              colorScheme="green"
              onClick={onCreateClick}
            >
              <IconPlus size={16} />
              {createButtonLabel}
            </Button>
          )}
        </HStack>
      )}

      <Box
        border="1px solid"
        borderColor={borderColor}
        rounded="lg"
        overflow="hidden"
        bg={cardBg}
        shadow="sm"
      >
        {/* Header */}
        <Box
          px={6}
          py={4}
          bg={headerBg}
          borderBottom="1px solid"
          borderColor={borderColor}
        >
          {table.getHeaderGroups().map((headerGroup) => (
            <Box key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <Text
                  key={header.id}
                  fontWeight="semibold"
                  fontSize="sm"
                  color={headerText}
                  cursor={header.column.getCanSort() ? "pointer" : "default"}
                  onClick={header.column.getToggleSortingHandler?.()}
                  _hover={header.column.getCanSort() ? { color: "green.600" } : {}}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted() === "asc" && " ↑"}
                  {header.column.getIsSorted() === "desc" && " ↓"}
                </Text>
              ))}
            </Box>
          ))}
        </Box>

        {/* Body */}
        <Box>
          {table.getRowModel().rows.map((row, index) => (
            <Box
              key={row.id}
              px={6}
              py={3}
              borderBottom={
                index !== table.getRowModel().rows.length - 1
                  ? "1px solid"
                  : "none"
              }
              borderColor={borderColor}
            >
              {row.getVisibleCells().map((cell) => (
                <Box key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}