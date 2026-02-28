// apps/mixtape/src/components/writing/library/LibraryPage.tsx

"use client"

import { useState, useEffect, useCallback, useMemo, type ReactNode } from "react"
import {
  Box,
  Flex,
  Text,
  Heading,
  HStack,
  VStack,
  Badge,
  Button,
  SimpleGrid,
  IconButton,
  Grid,
  GridItem,
  Wrap,
  Spinner,
} from "@chakra-ui/react"
import { Card, Avatar } from "@chakra-ui/react"
import {
  MenuRoot,
  MenuTrigger,
  MenuContent,
  MenuItem,
} from "@chakra-ui/react"
import { useColorModeValue } from "@components/ui/color-mode"
import { Divider } from "@components/common/Divider"
import { ContainerView, type ContainerItem } from "@components/common/ContainerView"
import {
  IconArrowLeft,
  IconBook2,
  IconFile,
  IconFileText,
  IconLayoutGrid,
  IconList,
  IconPlus,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconPackage,
  IconSend,
  IconClock,
  IconCalendar,
  IconX,
} from "@tabler/icons-react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ShelfColor =
  | "green" | "teal" | "blue" | "purple"
  | "orange" | "red" | "yellow" | "gray"

export interface LibraryItem {
  id: string
  title: string
  type: "post" | "article" | "dispatch" | "announcement" | "page" | "document"
  thumbnail?: string
  addedAt: string
  url?: string
  excerpt?: string
  tags?: string[]
  popular?: boolean
}

export interface LibraryShelf {
  id: string
  title: string
  description: string
  icon: string
  color: ShelfColor
  itemCount: number
  lastUpdated: string
  items: LibraryItem[]
  visibility?: "public" | "members" | "unlisted" | "private"
}

interface FlatLibraryItem extends LibraryItem {
  shelfId: string
  shelfTitle: string
  shelfColor: ShelfColor
  shelfIcon: string
}

interface MonthGroup {
  label: string
  yearMonth: string
  items: FlatLibraryItem[]
}

export interface LibraryPageProps {
  context: "group" | "member"
  groupName?: string
  groupAvatarUrl?: string
  canManage: boolean
  shelves: LibraryShelf[]
  isLoading?: boolean
  error?: string
  onCreateShelf?: () => void
  onEditShelf?: (shelfId: string) => void
  onDeleteShelf?: (shelfId: string) => void
  onAddItem?: (shelfId: string) => void
  onItemClick?: (item: LibraryItem) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TYPE_ICONS: Record<LibraryItem["type"], typeof IconBook2> = {
  post: IconFileText,
  article: IconBook2,
  dispatch: IconSend,
  announcement: IconPackage,
  page: IconFile,
  document: IconFileText,
}

const TYPE_LABELS: Record<LibraryItem["type"], string> = {
  post: "Post",
  article: "Article",
  dispatch: "Dispatch",
  announcement: "Announcement",
  page: "Page",
  document: "Document",
}

const TYPE_COLORS: Record<LibraryItem["type"], string> = {
  post: "blue",
  article: "green",
  dispatch: "purple",
  announcement: "orange",
  page: "teal",
  document: "gray",
}

const SHELF_ACCENT: Record<ShelfColor, string> = {
  green: "green.400",
  teal: "teal.400",
  blue: "blue.400",
  purple: "purple.400",
  orange: "orange.400",
  red: "red.400",
  yellow: "yellow.400",
  gray: "gray.400",
}

const SHELF_ICON_BG: Record<ShelfColor, string> = {
  green: "green.50",
  teal: "teal.50",
  blue: "blue.50",
  purple: "purple.50",
  orange: "orange.50",
  red: "red.50",
  yellow: "yellow.50",
  gray: "gray.50",
}

const SHELF_ICON_BG_DARK: Record<ShelfColor, string> = {
  green: "green.900",
  teal: "teal.900",
  blue: "blue.900",
  purple: "purple.900",
  orange: "orange.900",
  red: "red.900",
  yellow: "yellow.900",
  gray: "gray.700",
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return "Updated today"
  if (days === 1) return "Updated yesterday"
  if (days < 30) return `Updated ${days} days ago`
  const months = Math.floor(days / 30)
  return `Updated ${months}mo ago`
}

function formatArchiveDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

function formatMonthLabel(yearMonth: string): string {
  const [year, month] = yearMonth.split("-")
  const d = new Date(parseInt(year), parseInt(month) - 1)
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" })
}

function flattenItems(shelves: LibraryShelf[]): FlatLibraryItem[] {
  return shelves.flatMap((s) =>
    s.items.map((i) => ({
      ...i,
      shelfId: s.id,
      shelfTitle: s.title,
      shelfColor: s.color,
      shelfIcon: s.icon,
    }))
  )
}

function groupItemsByMonth(items: FlatLibraryItem[]): MonthGroup[] {
  const sorted = [...items].sort(
    (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
  )

  const groups: Record<string, FlatLibraryItem[]> = {}
  for (const item of sorted) {
    const d = new Date(item.addedAt)
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    if (!groups[ym]) groups[ym] = []
    groups[ym].push(item)
  }

  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([yearMonth, items]) => ({
      label: formatMonthLabel(yearMonth),
      yearMonth,
      items,
    }))
}

// ---------------------------------------------------------------------------
// ContainerView adapter
// ---------------------------------------------------------------------------

type LibraryContainerItem = ContainerItem & { meta: { type: LibraryItem["type"]; tags?: string[]; popular?: boolean } }

function toContainerItem(item: LibraryItem): LibraryContainerItem {
  return {
    id: item.id,
    title: item.title,
    subtitle: item.excerpt,
    thumbnail: item.thumbnail,
    date: item.addedAt,
    meta: { type: item.type, tags: item.tags, popular: item.popular },
  }
}

function fromContainerItem(items: LibraryItem[], ci: ContainerItem): LibraryItem | undefined {
  return items.find((i) => i.id === ci.id)
}

function renderLibraryBadge(item: LibraryContainerItem): ReactNode {
  const type = item.meta.type
  return (
    <Badge size="sm" colorScheme={TYPE_COLORS[type]} variant="subtle">
      {TYPE_LABELS[type]}
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// Mock Data (dates spread across 6+ months)
// ---------------------------------------------------------------------------

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString()
}

const MOCK_SHELVES: LibraryShelf[] = [
  {
    id: "shelf-1",
    title: "Permaculture Foundations",
    description: "Introduction to core permaculture design principles, ethics, and patterns for sustainable land use.",
    icon: "🌱",
    color: "green",
    itemCount: 5,
    lastUpdated: daysAgo(3),
    visibility: "public",
    items: [
      { id: "i1", title: "Permaculture Design Course - Module 1", type: "article", addedAt: daysAgo(5), tags: ["permaculture", "design"], popular: true },
      { id: "i2", title: "Zones and Sectors Worksheet", type: "document", addedAt: daysAgo(35), tags: ["permaculture", "worksheet"] },
      { id: "i3", title: "Bill Mollison - A Retrospective", type: "post", addedAt: daysAgo(70), tags: ["permaculture", "history"], popular: true },
      { id: "i4", title: "Gaia's Garden Book Notes", type: "article", addedAt: daysAgo(120), tags: ["book", "permaculture"] },
      { id: "i5", title: "Site Analysis Template", type: "page", addedAt: daysAgo(150), tags: ["template"] },
    ],
  },
  {
    id: "shelf-2",
    title: "Tapestry Map Resources",
    description: "Reference materials for bioregional mapping, watershed delineation, and community asset mapping.",
    icon: "🗺️",
    color: "teal",
    itemCount: 3,
    lastUpdated: daysAgo(5),
    visibility: "public",
    items: [
      { id: "i6", title: "Bioregional Mapping Guide", type: "article", addedAt: daysAgo(14), tags: ["mapping", "bioregion"] },
      { id: "i7", title: "Watershed Data Sources", type: "post", addedAt: daysAgo(60), tags: ["data", "watershed"] },
      { id: "i8", title: "Community Asset Mapping", type: "article", addedAt: daysAgo(95), tags: ["mapping", "community"], popular: true },
    ],
  },
  {
    id: "shelf-3",
    title: "Fermentation & Food",
    description: "Guides, recipes, and courses on fermentation, food preservation, and regenerative food systems.",
    icon: "🔥",
    color: "orange",
    itemCount: 4,
    lastUpdated: daysAgo(1),
    visibility: "members",
    items: [
      { id: "i9", title: "Wild Fermentation Masterclass", type: "dispatch", addedAt: daysAgo(8), tags: ["fermentation", "course"] },
      { id: "i10", title: "Lacto-Fermentation Basics", type: "post", addedAt: daysAgo(45), tags: ["fermentation", "lacto"] },
      { id: "i11", title: "Sourdough Starter Guide", type: "article", addedAt: daysAgo(85), tags: ["sourdough", "bread"] },
      { id: "i12", title: "Sandor Katz Interview Notes", type: "post", addedAt: daysAgo(130), tags: ["interview", "fermentation"], popular: true },
    ],
  },
  {
    id: "shelf-4",
    title: "Build Projects",
    description: "Plans, materials lists, and tutorials for natural building, earthworks, and small structures.",
    icon: "🏗️",
    color: "gray",
    itemCount: 3,
    lastUpdated: daysAgo(12),
    visibility: "private",
    items: [
      { id: "i13", title: "Cob Oven Construction Plans", type: "page", addedAt: daysAgo(25), tags: ["building", "cob"] },
      { id: "i14", title: "Rainwater Harvesting System", type: "article", addedAt: daysAgo(110), tags: ["water", "harvesting"] },
      { id: "i15", title: "Natural Building Workshop", type: "announcement", addedAt: daysAgo(170), tags: ["building", "workshop"] },
    ],
  },
  {
    id: "shelf-5",
    title: "Water Systems",
    description: "Swales, ponds, greywater recycling, and irrigation design for resilient water management.",
    icon: "💧",
    color: "blue",
    itemCount: 5,
    lastUpdated: daysAgo(7),
    visibility: "public",
    items: [
      { id: "i16", title: "Swale Design Calculator", type: "page", addedAt: daysAgo(3), tags: ["swales", "calculator"], popular: true },
      { id: "i17", title: "Greywater Systems Overview", type: "article", addedAt: daysAgo(50), tags: ["greywater", "course"] },
      { id: "i18", title: "Keyline Design Principles", type: "post", addedAt: daysAgo(100), tags: ["keyline", "design"] },
      { id: "i19", title: "Pond Construction Manual", type: "article", addedAt: daysAgo(140), tags: ["pond", "construction"] },
      { id: "i20", title: "Brad Lancaster - Water Harvesting", type: "dispatch", addedAt: daysAgo(180), tags: ["book", "water"] },
    ],
  },
]

// ---------------------------------------------------------------------------
// Shelf Sub-components (existing)
// ---------------------------------------------------------------------------

function LibraryHeader({
  context,
  groupName,
  groupAvatarUrl,
  canManage,
  shelves,
  topLevelView,
  onSetTopLevelView,
  onCreateShelf,
}: {
  context: "group" | "member"
  groupName?: string
  groupAvatarUrl?: string
  canManage: boolean
  shelves: LibraryShelf[]
  topLevelView: "shelves" | "chronological"
  onSetTopLevelView: (view: "shelves" | "chronological") => void
  onCreateShelf?: () => void
}) {
  const mutedText = useColorModeValue("gray.500", "gray.400")
  const activeBg = useColorModeValue("gray.100", "gray.700")
  const totalItems = shelves.reduce((sum, s) => sum + s.itemCount, 0)

  const viewToggle = (
    <HStack gap={0}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onSetTopLevelView("shelves")}
        bg={topLevelView === "shelves" ? activeBg : undefined}
        borderRightRadius={0}
      >
        <IconLayoutGrid size={16} /> Shelves
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onSetTopLevelView("chronological")}
        bg={topLevelView === "chronological" ? activeBg : undefined}
        borderLeftRadius={0}
        ml="-1px"
      >
        <IconCalendar size={16} /> By Date
      </Button>
    </HStack>
  )

  if (context === "group") {
    return (
      <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={3}>
        <HStack gap={4}>
          <Avatar.Root size="lg">
            <Avatar.Image src={groupAvatarUrl} />
            <Avatar.Fallback>{groupName?.[0] ?? "G"}</Avatar.Fallback>
          </Avatar.Root>
          <VStack align="start" gap={0}>
            <Heading size="lg">{groupName} — Library</Heading>
            <Text fontSize="sm" color={mutedText}>
              {totalItems} items across {shelves.length} shelves
            </Text>
          </VStack>
        </HStack>
        <HStack gap={3}>
          {viewToggle}
          {canManage && (
            <Button size="sm" onClick={onCreateShelf}>
              <IconPlus size={16} /> New Shelf
            </Button>
          )}
        </HStack>
      </Flex>
    )
  }

  return (
    <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={3}>
      <VStack align="start" gap={0}>
        <Heading size="lg">My Library</Heading>
        <Text fontSize="sm" color={mutedText}>
          Personal collection across all your groups and projects
        </Text>
      </VStack>
      <HStack gap={3}>
        {viewToggle}
        <Button size="sm" onClick={onCreateShelf}>
          <IconPlus size={16} /> New Shelf
        </Button>
      </HStack>
    </Flex>
  )
}

function ShelfTile({
  shelf,
  canManage,
  onClick,
  onEdit,
  onDelete,
}: {
  shelf: LibraryShelf
  canManage: boolean
  onClick: () => void
  onEdit?: () => void
  onDelete?: () => void
}) {
  const cardBg = useColorModeValue("white", "gray.800")
  const borderColor = useColorModeValue("gray.200", "gray.700")
  const hoverBg = useColorModeValue("gray.50", "gray.750")
  const mutedText = useColorModeValue("gray.500", "gray.400")
  const iconBg = useColorModeValue(
    SHELF_ICON_BG[shelf.color],
    SHELF_ICON_BG_DARK[shelf.color]
  )

  return (
    <Card.Root
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      borderLeft="4px solid"
      borderLeftColor={SHELF_ACCENT[shelf.color]}
      _hover={{
        bg: hoverBg,
        transform: "translateY(-2px)",
        shadow: "md",
      }}
      transition="all 0.2s"
      cursor="pointer"
      onClick={onClick}
    >
      <Card.Body>
        <Flex justify="space-between" align="start">
          <HStack gap={3} flex={1}>
            <Flex
              w={10}
              h={10}
              borderRadius="lg"
              bg={iconBg}
              align="center"
              justify="center"
              fontSize="xl"
              flexShrink={0}
            >
              {shelf.icon}
            </Flex>
            <VStack align="start" gap={1} flex={1} minW={0}>
              <HStack gap={2}>
                <Heading size="sm" fontWeight="semibold">
                  {shelf.title}
                </Heading>
                {canManage && shelf.visibility && (
                  <Badge size="sm" variant="subtle" colorScheme="gray" textTransform="capitalize">
                    {shelf.visibility}
                  </Badge>
                )}
              </HStack>
              <Text fontSize="sm" color={mutedText} lineClamp={1}>
                {shelf.description}
              </Text>
            </VStack>
          </HStack>
          {canManage && (
            <Box onClick={(e) => e.stopPropagation()}>
              <MenuRoot positioning={{ placement: "bottom-end" }}>
                <MenuTrigger asChild>
                  <IconButton
                    aria-label="Shelf actions"
                    variant="ghost"
                    size="sm"
                  >
                    <IconDotsVertical size={16} />
                  </IconButton>
                </MenuTrigger>
                <MenuContent>
                  <MenuItem value="edit" onClick={() => onEdit?.()}>
                    <IconEdit size={14} /> Edit Shelf
                  </MenuItem>
                  <MenuItem value="delete" onClick={() => onDelete?.()}>
                    <IconTrash size={14} /> Delete Shelf
                  </MenuItem>
                </MenuContent>
              </MenuRoot>
            </Box>
          )}
        </Flex>
        <HStack gap={4} mt={4}>
          <HStack gap={1}>
            <IconPackage size={14} color="var(--chakra-colors-gray-400)" />
            <Text fontSize="xs" color={mutedText}>
              {shelf.itemCount} items
            </Text>
          </HStack>
          <HStack gap={1}>
            <IconClock size={14} color="var(--chakra-colors-gray-400)" />
            <Text fontSize="xs" color={mutedText}>
              {relativeDate(shelf.lastUpdated)}
            </Text>
          </HStack>
        </HStack>
      </Card.Body>
    </Card.Root>
  )
}

function ShelfGrid({
  shelves,
  canManage,
  onSelectShelf,
  onEditShelf,
  onDeleteShelf,
}: {
  shelves: LibraryShelf[]
  canManage: boolean
  onSelectShelf: (shelf: LibraryShelf) => void
  onEditShelf?: (shelfId: string) => void
  onDeleteShelf?: (shelfId: string) => void
}) {
  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
      {shelves.map((shelf) => (
        <ShelfTile
          key={shelf.id}
          shelf={shelf}
          canManage={canManage}
          onClick={() => onSelectShelf(shelf)}
          onEdit={() => onEditShelf?.(shelf.id)}
          onDelete={() => onDeleteShelf?.(shelf.id)}
        />
      ))}
    </SimpleGrid>
  )
}

function ShelfViewHeader({
  shelf,
  itemView,
  onBack,
  onToggleView,
}: {
  shelf: LibraryShelf
  itemView: "grid" | "list"
  onBack: () => void
  onToggleView: (view: "grid" | "list") => void
}) {
  const mutedText = useColorModeValue("gray.500", "gray.400")
  const activeBg = useColorModeValue("gray.100", "gray.700")

  return (
    <Flex justify="space-between" align="center" mb={4}>
      <HStack gap={3}>
        <Button variant="ghost" size="sm" onClick={onBack}>
          <IconArrowLeft size={16} /> Back to Shelves
        </Button>
      </HStack>
      <HStack gap={2}>
        <Text fontSize="xl">{shelf.icon}</Text>
        <Heading size="md">{shelf.title}</Heading>
        <Text fontSize="sm" color={mutedText}>
          ({shelf.itemCount} items)
        </Text>
      </HStack>
      <HStack gap={1}>
        <IconButton
          aria-label="Grid view"
          variant="ghost"
          size="sm"
          bg={itemView === "grid" ? activeBg : undefined}
          onClick={() => onToggleView("grid")}
        >
          <IconLayoutGrid size={18} />
        </IconButton>
        <IconButton
          aria-label="List view"
          variant="ghost"
          size="sm"
          bg={itemView === "list" ? activeBg : undefined}
          onClick={() => onToggleView("list")}
        >
          <IconList size={18} />
        </IconButton>
      </HStack>
    </Flex>
  )
}

function ShelfView({
  shelf,
  canManage,
  itemView,
  onBack,
  onToggleView,
  onAddItem,
  onItemClick,
}: {
  shelf: LibraryShelf
  canManage: boolean
  itemView: "grid" | "list"
  onBack: () => void
  onToggleView: (view: "grid" | "list") => void
  onAddItem?: () => void
  onItemClick?: (item: LibraryItem) => void
}) {
  const containerItems = useMemo(
    () => shelf.items.map(toContainerItem),
    [shelf.items]
  )

  const handleItemClick = useCallback(
    (ci: ContainerItem) => {
      const original = fromContainerItem(shelf.items, ci)
      if (original) onItemClick?.(original)
    },
    [shelf.items, onItemClick]
  )

  return (
    <Box>
      <ShelfViewHeader
        shelf={shelf}
        itemView={itemView}
        onBack={onBack}
        onToggleView={onToggleView}
      />
      {canManage && (
        <Flex justify="flex-end" mb={4}>
          <Button size="sm" onClick={() => onAddItem?.()}>
            <IconPlus size={16} /> Add Item
          </Button>
        </Flex>
      )}
      <ContainerView
        items={containerItems}
        viewMode={itemView}
        onItemClick={handleItemClick}
        renderBadge={renderLibraryBadge}
        emptyStateMessage="No items on this shelf yet."
      />
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Chronological Archive Sub-components
// ---------------------------------------------------------------------------

function ArchiveItemRow({
  item,
  isLast,
  onItemClick,
}: {
  item: FlatLibraryItem
  isLast: boolean
  onItemClick?: (item: LibraryItem) => void
}) {
  const mutedText = useColorModeValue("gray.500", "gray.400")
  const rowHoverBg = useColorModeValue("gray.50", "gray.750")
  const dotColor = useColorModeValue(
    SHELF_ACCENT[item.shelfColor],
    SHELF_ACCENT[item.shelfColor]
  )
  const TypeIcon = TYPE_ICONS[item.type]

  return (
    <>
      <Flex
        align="center"
        py={2}
        px={3}
        _hover={{ bg: rowHoverBg }}
        cursor="pointer"
        borderRadius="md"
        onClick={() => onItemClick?.(item)}
      >
        <Box mr={3} flexShrink={0}>
          <TypeIcon
            size={18}
            color={`var(--chakra-colors-${TYPE_COLORS[item.type]}-400)`}
          />
        </Box>
        <VStack align="start" gap={0} flex={1} minW={0}>
          <Text fontSize="sm" fontWeight="medium" lineClamp={1}>
            {item.title}
          </Text>
          <HStack gap={1}>
            <Box
              w={2}
              h={2}
              borderRadius="full"
              bg={dotColor}
              flexShrink={0}
            />
            <Text fontSize="xs" color={mutedText}>
              {item.shelfTitle}
            </Text>
          </HStack>
        </VStack>
        <Text
          fontSize="sm"
          color={mutedText}
          whiteSpace="nowrap"
          ml={4}
          flexShrink={0}
        >
          {formatArchiveDate(item.addedAt)}
        </Text>
      </Flex>
      {!isLast && <Divider my={0} />}
    </>
  )
}

function ChronologicalArchive({
  items,
  typeFilter,
  onItemClick,
}: {
  items: FlatLibraryItem[]
  typeFilter: LibraryItem["type"] | null
  onItemClick?: (item: LibraryItem) => void
}) {
  const accentColor = useColorModeValue("green.400", "green.400")
  const mutedText = useColorModeValue("gray.500", "gray.400")

  const filtered = typeFilter
    ? items.filter((i) => i.type === typeFilter)
    : items

  const monthGroups = useMemo(() => groupItemsByMonth(filtered), [filtered])

  if (filtered.length === 0) {
    return (
      <Box textAlign="center" py={12}>
        <Text color={mutedText}>
          {typeFilter
            ? `No ${TYPE_LABELS[typeFilter].toLowerCase()} items in the library.`
            : "Nothing in the library yet. Start by adding items to your shelves."}
        </Text>
      </Box>
    )
  }

  return (
    <VStack align="stretch" gap={8}>
      {monthGroups.map((group) => (
        <Box key={group.yearMonth}>
          <Heading
            size="md"
            fontWeight="semibold"
            mb={3}
            pl={3}
            borderLeft="3px solid"
            borderColor={accentColor}
          >
            {group.label}
          </Heading>
          <VStack align="stretch" gap={0}>
            {group.items.map((item, idx) => (
              <ArchiveItemRow
                key={item.id}
                item={item}
                isLast={idx === group.items.length - 1}
                onItemClick={onItemClick}
              />
            ))}
          </VStack>
        </Box>
      ))}
    </VStack>
  )
}

function ArchiveSidebar({
  shelves,
  allItems,
  typeFilter,
  onSetTypeFilter,
  onNavigateToShelf,
  onItemClick,
}: {
  shelves: LibraryShelf[]
  allItems: FlatLibraryItem[]
  typeFilter: LibraryItem["type"] | null
  onSetTypeFilter: (type: LibraryItem["type"] | null) => void
  onNavigateToShelf: (shelf: LibraryShelf) => void
  onItemClick?: (item: LibraryItem) => void
}) {
  const mutedText = useColorModeValue("gray.500", "gray.400")
  const labelColor = useColorModeValue("gray.600", "gray.300")
  const hoverBg = useColorModeValue("gray.50", "gray.750")
  const cardBg = useColorModeValue("white", "gray.800")
  const borderColor = useColorModeValue("gray.200", "gray.700")

  // Popular items: flagged popular, or fallback to 5 most recent
  const popularItems = useMemo(() => {
    const flagged = allItems.filter((i) => i.popular)
    if (flagged.length > 0) return flagged.slice(0, 5)
    return [...allItems]
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
      .slice(0, 5)
  }, [allItems])

  // Type counts
  const typeCounts = useMemo(() => {
    const counts: Partial<Record<LibraryItem["type"], number>> = {}
    for (const item of allItems) {
      counts[item.type] = (counts[item.type] || 0) + 1
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => (b as number) - (a as number)) as [LibraryItem["type"], number][]
  }, [allItems])

  // Tags
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    for (const item of allItems) {
      item.tags?.forEach((t) => tags.add(t))
    }
    return Array.from(tags).sort()
  }, [allItems])

  return (
    <VStack align="stretch" gap={6}>
      {/* Shelves Widget */}
      <Card.Root bg={cardBg} border="1px solid" borderColor={borderColor}>
        <Card.Body p={4}>
          <Text
            fontSize="xs"
            fontWeight="bold"
            color={labelColor}
            textTransform="uppercase"
            letterSpacing="wider"
            mb={3}
          >
            Shelves
          </Text>
          <VStack align="stretch" gap={1}>
            {shelves.map((shelf) => (
              <Flex
                key={shelf.id}
                align="center"
                justify="space-between"
                py={1.5}
                px={2}
                borderRadius="md"
                _hover={{ bg: hoverBg }}
                cursor="pointer"
                onClick={() => onNavigateToShelf(shelf)}
              >
                <HStack gap={2}>
                  <Box
                    w={2.5}
                    h={2.5}
                    borderRadius="full"
                    bg={SHELF_ACCENT[shelf.color]}
                    flexShrink={0}
                  />
                  <Text fontSize="sm">{shelf.title}</Text>
                </HStack>
                <Text fontSize="xs" color={mutedText}>
                  {shelf.itemCount}
                </Text>
              </Flex>
            ))}
          </VStack>
        </Card.Body>
      </Card.Root>

      {/* Popular Widget */}
      <Card.Root bg={cardBg} border="1px solid" borderColor={borderColor}>
        <Card.Body p={4}>
          <Text
            fontSize="xs"
            fontWeight="bold"
            color={labelColor}
            textTransform="uppercase"
            letterSpacing="wider"
            mb={3}
          >
            Popular
          </Text>
          <VStack align="stretch" gap={1}>
            {popularItems.map((item) => {
              const TypeIcon = TYPE_ICONS[item.type]
              return (
                <HStack
                  key={item.id}
                  gap={2}
                  py={1}
                  px={2}
                  borderRadius="md"
                  _hover={{ bg: hoverBg }}
                  cursor="pointer"
                  onClick={() => onItemClick?.(item)}
                >
                  <TypeIcon
                    size={14}
                    color={`var(--chakra-colors-${TYPE_COLORS[item.type]}-400)`}
                  />
                  <Text fontSize="sm" lineClamp={1}>
                    {item.title}
                  </Text>
                </HStack>
              )
            })}
          </VStack>
        </Card.Body>
      </Card.Root>

      {/* By Type Widget */}
      <Card.Root bg={cardBg} border="1px solid" borderColor={borderColor}>
        <Card.Body p={4}>
          <Text
            fontSize="xs"
            fontWeight="bold"
            color={labelColor}
            textTransform="uppercase"
            letterSpacing="wider"
            mb={3}
          >
            By Type
          </Text>
          <VStack align="stretch" gap={1}>
            {typeCounts.map(([type, count]) => {
              const TypeIcon = TYPE_ICONS[type]
              const isActive = typeFilter === type
              return (
                <Flex
                  key={type}
                  align="center"
                  justify="space-between"
                  py={1.5}
                  px={2}
                  borderRadius="md"
                  bg={isActive ? hoverBg : undefined}
                  _hover={{ bg: hoverBg }}
                  cursor="pointer"
                  onClick={() =>
                    onSetTypeFilter(isActive ? null : type)
                  }
                >
                  <HStack gap={2}>
                    <TypeIcon
                      size={14}
                      color={`var(--chakra-colors-${TYPE_COLORS[type]}-400)`}
                    />
                    <Text fontSize="sm" fontWeight={isActive ? "semibold" : undefined}>
                      {TYPE_LABELS[type]}
                    </Text>
                  </HStack>
                  <Text fontSize="xs" color={mutedText}>
                    {count}
                  </Text>
                </Flex>
              )
            })}
          </VStack>
        </Card.Body>
      </Card.Root>

      {/* Tags Widget */}
      <Card.Root bg={cardBg} border="1px solid" borderColor={borderColor}>
        <Card.Body p={4}>
          <Text
            fontSize="xs"
            fontWeight="bold"
            color={labelColor}
            textTransform="uppercase"
            letterSpacing="wider"
            mb={3}
          >
            Tags
          </Text>
          {allTags.length > 0 ? (
            <Wrap gap={2}>
              {allTags.map((tag) => (
                <Badge
                  key={tag}
                  size="sm"
                  variant="subtle"
                  colorScheme="gray"
                  cursor="pointer"
                >
                  {tag}
                </Badge>
              ))}
            </Wrap>
          ) : (
            <Text fontSize="sm" color={mutedText}>
              No tags yet.
            </Text>
          )}
        </Card.Body>
      </Card.Root>
    </VStack>
  )
}

function ChronologicalView({
  shelves,
  allItems,
  typeFilter,
  onSetTypeFilter,
  onNavigateToShelf,
  onItemClick,
}: {
  shelves: LibraryShelf[]
  allItems: FlatLibraryItem[]
  typeFilter: LibraryItem["type"] | null
  onSetTypeFilter: (type: LibraryItem["type"] | null) => void
  onNavigateToShelf: (shelf: LibraryShelf) => void
  onItemClick?: (item: LibraryItem) => void
}) {
  // const filterBg = useColorModeValue("blue.50", "blue.900")

  return (
    <Box>
      {typeFilter && (
        <Flex align="center" gap={2} mb={4}>
          <Text fontSize="sm">Showing:</Text>
          <Badge
            size="sm"
            colorScheme={TYPE_COLORS[typeFilter]}
            variant="subtle"
            cursor="pointer"
            onClick={() => onSetTypeFilter(null)}
          >
            {TYPE_LABELS[typeFilter]} <IconX size={12} style={{ display: "inline", marginLeft: 4 }} />
          </Badge>
        </Flex>
      )}
      <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={8}>
        <GridItem>
          <ChronologicalArchive items={allItems} typeFilter={typeFilter} onItemClick={onItemClick} />
        </GridItem>
        <GridItem>
          <ArchiveSidebar
            shelves={shelves}
            allItems={allItems}
            typeFilter={typeFilter}
            onSetTypeFilter={onSetTypeFilter}
            onNavigateToShelf={onNavigateToShelf}
            onItemClick={onItemClick}
          />
        </GridItem>
      </Grid>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const STORAGE_KEY = "mixtape-library-item-view"

export default function LibraryPage({
  context,
  groupName,
  groupAvatarUrl,
  canManage,
  shelves = MOCK_SHELVES,
  isLoading = false,
  error,
  onCreateShelf,
  onEditShelf,
  onDeleteShelf,
  onAddItem,
  onItemClick,
}: LibraryPageProps) {
  const [activeShelf, setActiveShelf] = useState<LibraryShelf | null>(null)
  const [itemView, setItemView] = useState<"grid" | "list">("grid")
  const [topLevelView, setTopLevelView] = useState<"shelves" | "chronological">("shelves")
  const [typeFilter, setTypeFilter] = useState<LibraryItem["type"] | null>(null)
  const pageBg = useColorModeValue("gray.50", "gray.900")

  const allItems = useMemo(() => flattenItems(shelves), [shelves])

  // Persist view preference
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === "grid" || saved === "list") {
      setItemView(saved)
    }
  }, [])

  const handleToggleView = useCallback((view: "grid" | "list") => {
    setItemView(view)
    localStorage.setItem(STORAGE_KEY, view)
  }, [])

  const handleSetTopLevelView = useCallback(
    (view: "shelves" | "chronological") => {
      setTopLevelView(view)
      if (view === "shelves") {
        setActiveShelf(null)
      }
      if (view === "chronological") {
        setTypeFilter(null)
      }
    },
    []
  )

  const handleNavigateToShelf = useCallback((shelf: LibraryShelf) => {
    setTopLevelView("shelves")
    setActiveShelf(shelf)
  }, [])

  const showShelves = topLevelView === "shelves"
  const showChronological = topLevelView === "chronological"

  return (
    <Box bg={pageBg} minH="100vh" p={6}>
      <LibraryHeader
        context={context}
        groupName={groupName}
        groupAvatarUrl={groupAvatarUrl}
        canManage={canManage}
        shelves={shelves}
        topLevelView={topLevelView}
        onSetTopLevelView={handleSetTopLevelView}
        onCreateShelf={onCreateShelf}
      />

      {isLoading && (
        <Flex justify="center" align="center" minH={400}>
          <HStack gap={3} color="gray.500">
            <Spinner size="md" />
            <Text>Loading shelves...</Text>
          </HStack>
        </Flex>
      )}

      {!isLoading && error && (
        <Box textAlign="center" py={12}>
          <Text color="red.500">{error}</Text>
        </Box>
      )}

      {!isLoading && !error && <Box position="relative" minH={400}>
        {/* Shelves Mode: Grid + Detail */}
        <Box
          opacity={showShelves && !activeShelf ? 1 : 0}
          pointerEvents={showShelves && !activeShelf ? "auto" : "none"}
          transition="opacity 0.25s ease"
          position={showShelves && !activeShelf ? "relative" : "absolute"}
          width="100%"
          top={0}
        >
          <ShelfGrid
            shelves={shelves}
            canManage={canManage}
            onSelectShelf={setActiveShelf}
            onEditShelf={onEditShelf}
            onDeleteShelf={onDeleteShelf}
          />
        </Box>

        <Box
          opacity={showShelves && activeShelf ? 1 : 0}
          pointerEvents={showShelves && activeShelf ? "auto" : "none"}
          transition="opacity 0.25s ease"
          position={showShelves && activeShelf ? "relative" : "absolute"}
          width="100%"
          top={0}
        >
          {activeShelf && (
            <ShelfView
              shelf={activeShelf}
              canManage={canManage}
              itemView={itemView}
              onBack={() => setActiveShelf(null)}
              onToggleView={handleToggleView}
              onAddItem={() => onAddItem?.(activeShelf.id)}
              onItemClick={onItemClick}
            />
          )}
        </Box>

        {/* Chronological Mode */}
        <Box
          opacity={showChronological ? 1 : 0}
          pointerEvents={showChronological ? "auto" : "none"}
          transition="opacity 0.25s ease"
          position={showChronological ? "relative" : "absolute"}
          width="100%"
          top={0}
        >
          <ChronologicalView
            shelves={shelves}
            allItems={allItems}
            typeFilter={typeFilter}
            onSetTypeFilter={setTypeFilter}
            onNavigateToShelf={handleNavigateToShelf}
            onItemClick={onItemClick}
          />
        </Box>
      </Box>}
    </Box>
  )
}
