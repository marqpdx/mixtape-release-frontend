'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useBackNavigableDetail } from '@/hooks/useBackNavigableDetail';
import {
  Box,
  Flex,
  Grid,
  Text,
  HStack,
  VStack,
  Badge,
  Input,
  Textarea,
  Button,
  IconButton,
  Spinner,
  SegmentGroup,
} from '@chakra-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronRight,
  LayoutGrid,
  List,
  Search,
  Eye,
  Download,
  ArrowRight,
  Plus,
  Pencil,
  Check,
  X,
  Trash2,
} from 'lucide-react';
import {
  useCollections,
  useCollectionItems,
  useCreateCollection,
  useUpdateCollection,
  useDeleteCollection,
} from '@mixtape/api/hooks/stackroom/useCollections';
import { CollectionBrowser } from '@/components/stackroom/CollectionBrowser';
import { toaster } from '@/components/ui/toaster';
import { useColorModeValue } from '@components/ui/color-mode';
import { useViewMode } from './explorer/useViewMode';
import { hueForName, coverGradient } from './explorer/coverUtils';
import {
  getItemDisplayName,
  getItemTypeInfo,
  getItemSize,
} from './explorer/fileTypeUtils';
import type { ItemTypeInfo } from './explorer/fileTypeUtils';
import { CollectionItemReader } from './CollectionItemReader';
import type { CollectionListItem, LibraryItem } from '@mixtape/core/types/collectionTypes';
import { formatDistanceToNow } from 'date-fns';

// ---- types ------------------------------------------------------------------

interface ExplorerNav {
  collectionId: string | null;
  folderId: string | null;
}

interface SponsorInfo {
  type: 'group' | 'user';
  id: string;
  slug: string;
  displayName: string;
}

export interface CollectionsExplorerProps {
  sponsor: SponsorInfo;
  initialCollectionId?: string | null;
  isAdmin?: boolean;
}

// ---- helpers ----------------------------------------------------------------

function relativeTime(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

// ---- file type icon + pill (matches admin CollectionItemCard styling) ------

function FileTypeIcon({ info, size = 20 }: { info: ItemTypeInfo; size?: number }) {
  const Icon = info.icon;
  return (
    <Box className="cex-chip" color={`var(--chakra-colors-${info.colorScheme}-500)`} flexShrink={0}>
      <Icon size={size} />
    </Box>
  );
}

function FileTypePill({ info }: { info: ItemTypeInfo }) {
  return (
    <Badge colorPalette={info.colorScheme} size="sm">
      {info.label}
    </Badge>
  );
}

// ---- folder glyph -----------------------------------------------------------

function FolderGlyph({ size = 28, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2.2 6.4c0-1 .8-1.8 1.8-1.8h4.3c.5 0 1 .2 1.3.6l1 1.1c.2.2.5.4.8.4h6.6c1 0 1.8.8 1.8 1.8v8.9c0 1-.8 1.8-1.8 1.8H4c-1 0-1.8-.8-1.8-1.8V6.4Z"
        fill={color}
        fillOpacity="0.18"
        stroke={color}
        strokeWidth="1.4"
      />
    </svg>
  );
}

// ---- cover folder (big translucent, inside card cover) ---------------------

function CoverFolder({ size = 130 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2.2 6.4c0-1 .8-1.8 1.8-1.8h4.3c.5 0 1 .2 1.3.6l1 1.1c.2.2.5.4.8.4h6.6c1 0 1.8.8 1.8 1.8v8.9c0 1-.8 1.8-1.8 1.8H4c-1 0-1.8-.8-1.8-1.8V6.4Z"
        fill="rgba(255,255,255,0.28)"
      />
    </svg>
  );
}

// ---- sidebar ----------------------------------------------------------------

interface SidebarProps {
  collections: CollectionListItem[];
  nav: ExplorerNav;
  folderItems: LibraryItem[];
  onNav: (next: ExplorerNav) => void;
}

function Sidebar({ collections, nav, folderItems, onNav }: SidebarProps) {
  const bg = useColorModeValue('bg.subtle', 'bg.subtle');
  const borderColor = useColorModeValue('border.default', 'border.default');
  const nodeHoverBg = useColorModeValue('bg.canvas', 'bg.canvas');
  const activeBg = useColorModeValue('theme.accentSoft', 'theme.accentSoft');
  const activeText = useColorModeValue('theme.accent', 'theme.accent');
  const textColor = useColorModeValue('theme.text', 'theme.text');
  const mutedColor = useColorModeValue('theme.textMuted', 'theme.textMuted');
  const countColor = useColorModeValue('theme.textFaint', 'theme.textFaint');

  const folders = folderItems.filter((i): i is LibraryItem & { is_folder: true } =>
    i.is_folder && !i.parent_id
  );

  return (
    <Box
      className="cex-sidebar"
      w="240px"
      flexShrink={0}
      bg={bg}
      borderRight="1px solid"
      borderColor={borderColor}
      display="flex"
      flexDir="column"
      overflowY="auto"
      py={3}
    >
      {/* All Collections node */}
      <Box
        px={3}
        py={2}
        mx={2}
        borderRadius="md"
        cursor="pointer"
        display="flex"
        alignItems="center"
        gap={2}
        bg={!nav.collectionId ? activeBg : 'transparent'}
        color={!nav.collectionId ? activeText : textColor}
        _hover={{ bg: !nav.collectionId ? activeBg : nodeHoverBg }}
        transition="background 0.12s"
        onClick={() => onNav({ collectionId: null, folderId: null })}
      >
        <Box flexShrink={0} opacity={0.6}>
          <LayoutGrid size={14} />
        </Box>
        <Text fontSize="sm" fontWeight={!nav.collectionId ? '600' : '500'} flex={1} lineClamp={1}>
          All Collections
        </Text>
        <Text fontFamily="mono" fontSize="11px" color={countColor} flexShrink={0}>
          {collections.length}
        </Text>
      </Box>

      <Box mx={3} my={2} h="1px" bg={borderColor} />

      {/* Collection nodes */}
      {collections.map((c) => {
        const isActive = nav.collectionId === c.id;
        const hue = hueForName(c.title);
        const swatchGrad = coverGradient(hue);
        const showFolders = isActive && folders.length > 0;

        return (
          <Box key={c.id}>
            <Box
              px={3}
              py={1.5}
              mx={2}
              borderRadius="md"
              cursor="pointer"
              display="flex"
              alignItems="center"
              gap={2}
              bg={isActive && !nav.folderId ? activeBg : 'transparent'}
              color={isActive && !nav.folderId ? activeText : textColor}
              _hover={{ bg: isActive && !nav.folderId ? activeBg : nodeHoverBg }}
              transition="background 0.12s"
              onClick={() => onNav({ collectionId: c.id, folderId: null })}
            >
              <Box
                flexShrink={0}
                color={mutedColor}
                style={{
                  transform: showFolders ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s',
                  visibility: isActive && folders.length > 0 ? 'visible' : 'hidden',
                }}
              >
                <ChevronRight size={12} />
              </Box>
              <Box
                flexShrink={0}
                w="14px"
                h="14px"
                borderRadius="3px"
                style={{ background: swatchGrad }}
              />
              <Text
                fontSize="13px"
                fontWeight={isActive && !nav.folderId ? '600' : '400'}
                flex={1}
                lineClamp={1}
                color={isActive && !nav.folderId ? activeText : textColor}
              >
                {c.title}
              </Text>
              <Text fontFamily="mono" fontSize="11px" color={countColor} flexShrink={0}>
                {c.item_count}
              </Text>
            </Box>

            {/* Folder children */}
            <AnimatePresence>
              {showFolders && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  style={{ overflow: 'hidden' }}
                >
                  {folders.map((fo) => {
                    const folderActive = nav.folderId === fo.id;
                    return (
                      <Box
                        key={fo.id}
                        pl={10}
                        pr={3}
                        py={1.5}
                        mx={2}
                        borderRadius="md"
                        cursor="pointer"
                        display="flex"
                        alignItems="center"
                        gap={1.5}
                        bg={folderActive ? activeBg : 'transparent'}
                        color={folderActive ? activeText : mutedColor}
                        _hover={{ bg: folderActive ? activeBg : nodeHoverBg }}
                        transition="background 0.12s"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNav({ collectionId: c.id, folderId: fo.id });
                        }}
                      >
                        <FolderGlyph size={14} color="currentColor" />
                        <Text
                          fontSize="12px"
                          fontWeight={folderActive ? '600' : '400'}
                          flex={1}
                          lineClamp={1}
                        >
                          {fo.title}
                        </Text>
                      </Box>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        );
      })}
    </Box>
  );
}

// ---- top bar ----------------------------------------------------------------

interface TopbarProps {
  nav: ExplorerNav;
  collection: CollectionListItem | null;
  folder: (LibraryItem & { is_folder: true }) | null;
  onNav: (next: ExplorerNav) => void;
  mode: 'list' | 'grid';
  onModeChange: (m: 'list' | 'grid') => void;
  q: string;
  onQ: (q: string) => void;
  isAdmin?: boolean;
  onNew?: () => void;
}

function Topbar({ nav, collection, folder, onNav, mode, onModeChange, q, onQ, isAdmin, onNew }: TopbarProps) {
  const borderColor = useColorModeValue('border.default', 'border.default');
  const accentText = useColorModeValue('theme.accent', 'theme.accent');
  const mutedText = useColorModeValue('theme.textSecondary', 'theme.textSecondary');
  const textColor = useColorModeValue('theme.text', 'theme.text');
  const inputBg = useColorModeValue('bg.canvas', 'bg.canvas');

  return (
    <Box
      className="cex-topbar"
      px={4}
      py={2.5}
      borderBottom="1px solid"
      borderColor={borderColor}
      display="flex"
      alignItems="center"
      gap={4}
      flexShrink={0}
      minH="48px"
    >
      {/* Breadcrumb */}
      <HStack gap={1} flex={1} minW={0} overflow="hidden">
        <Text
          fontFamily="mono"
          fontSize="12px"
          cursor={collection ? 'pointer' : 'default'}
          color={collection ? accentText : textColor}
          fontWeight={collection ? '500' : '600'}
          whiteSpace="nowrap"
          _hover={collection ? { textDecoration: 'underline' } : {}}
          onClick={() => collection && onNav({ collectionId: null, folderId: null })}
        >
          All Collections
        </Text>

        {collection && (
          <>
            <Text fontFamily="mono" fontSize="12px" color={mutedText} flexShrink={0}>/</Text>
            <Text
              fontFamily="mono"
              fontSize="12px"
              cursor={folder ? 'pointer' : 'default'}
              color={folder ? accentText : textColor}
              fontWeight={folder ? '500' : '600'}
              lineClamp={1}
              _hover={folder ? { textDecoration: 'underline' } : {}}
              onClick={() => folder && onNav({ collectionId: collection.id, folderId: null })}
            >
              {collection.title}
            </Text>
          </>
        )}

        {folder && (
          <>
            <Text fontFamily="mono" fontSize="12px" color={mutedText} flexShrink={0}>/</Text>
            <Text
              fontFamily="mono"
              fontSize="12px"
              fontWeight="600"
              color={textColor}
              lineClamp={1}
            >
              {folder.title}
            </Text>
          </>
        )}
      </HStack>

      {/* Search */}
      <HStack
        gap={1.5}
        bg={inputBg}
        border="1px solid"
        borderColor={borderColor}
        borderRadius="md"
        px={2.5}
        py={1}
        minW="180px"
        maxW="260px"
      >
        <Box color={mutedText} flexShrink={0}><Search size={13} /></Box>
        <Input
          border="none"
          outline="none"
          bg="transparent"
          px={0}
          py={0}
          h="auto"
          fontSize="13px"
          value={q}
          onChange={(e) => onQ(e.target.value)}
          placeholder={nav.collectionId ? 'Search in collection…' : 'Search collections…'}
          _focus={{ boxShadow: 'none' }}
        />
      </HStack>

      {/* List / Grid toggle */}
      <SegmentGroup.Root
        className="cex-toggle"
        value={mode}
        onValueChange={(e) => onModeChange(e.value as 'list' | 'grid')}
        size="sm"
      >
        <SegmentGroup.Indicator />
        <SegmentGroup.Item value="list">
          <SegmentGroup.ItemText>
            <HStack gap={1} fontSize="12px">
              <List size={13} />
              <Text>List</Text>
            </HStack>
          </SegmentGroup.ItemText>
          <SegmentGroup.ItemHiddenInput />
        </SegmentGroup.Item>
        <SegmentGroup.Item value="grid">
          <SegmentGroup.ItemText>
            <HStack gap={1} fontSize="12px">
              <LayoutGrid size={13} />
              <Text>Grid</Text>
            </HStack>
          </SegmentGroup.ItemText>
          <SegmentGroup.ItemHiddenInput />
        </SegmentGroup.Item>
      </SegmentGroup.Root>

      {isAdmin && !nav.collectionId && onNew && (
        <Button size="xs" onClick={onNew} colorPalette="orange" variant="subtle">
          <Plus size={12} />
          New
        </Button>
      )}
    </Box>
  );
}

// ---- collection card (grid view) -------------------------------------------

function CollectionCard({ c, onOpen }: { c: CollectionListItem; onOpen: () => void }) {
  const hue = hueForName(c.title);
  const bg = coverGradient(hue);

  return (
    <Box
      className="cex-card"
      borderRadius="xl"
      overflow="hidden"
      cursor="pointer"
      border="1px solid"
      borderColor="border.default"
      bg="bg.surface"
      transition="transform 0.15s, box-shadow 0.15s, border-color 0.15s"
      _hover={{
        transform: 'translateY(-4px)',
        boxShadow: 'lg',
        borderColor: 'theme.accent',
      }}
      onClick={onOpen}
    >
      {/* Cover */}
      <Box
        h="120px"
        position="relative"
        overflow="hidden"
        style={{ background: bg }}
      >
        <Box position="absolute" bottom="-12px" right="-12px" opacity={0.22}>
          <CoverFolder size={140} />
        </Box>
      </Box>

      {/* Body */}
      <Box p={4}>
        <Text
          fontFamily="heading"
          fontSize="lg"
          fontWeight="600"
          lineHeight="1.2"
          letterSpacing="-0.01em"
          color="theme.text"
          mb={1.5}
          lineClamp={2}
        >
          {c.title}
        </Text>

        {c.summary && (
          <Text fontSize="13px" color="theme.textSecondary" lineClamp={2} lineHeight="1.5" mb={3}>
            {c.summary}
          </Text>
        )}

        <HStack gap={3} fontSize="12px" color="theme.textMuted" fontFamily="mono">
          <Text>{c.item_count} items</Text>
          {c.file_count > 0 && <Text>· {c.file_count} files</Text>}
        </HStack>

        <HStack justify="space-between" mt={3} pt={3} borderTop="1px solid" borderColor="border.default">
          <Text fontFamily="mono" fontSize="11px" color="theme.textFaint">
            {relativeTime(c.updated_at)}
          </Text>
          <HStack gap={1} fontSize="12px" color="theme.accent" fontWeight="600">
            <Text>Open</Text>
            <ArrowRight size={13} />
          </HStack>
        </HStack>
      </Box>
    </Box>
  );
}

// ---- collection row (list view) --------------------------------------------

function CollectionRow({ c, onOpen }: { c: CollectionListItem; onOpen: () => void }) {
  const hue = hueForName(c.title);
  const bg = coverGradient(hue);
  const borderColor = useColorModeValue('border.default', 'border.default');
  const hoverBg = useColorModeValue('bg.subtle', 'bg.subtle');

  return (
    <Box
      className="cex-row"
      display="grid"
      gridTemplateColumns="minmax(0,1fr) 90px 120px 28px"
      alignItems="center"
      gap={4}
      px={4}
      py={3}
      cursor="pointer"
      borderBottom="1px solid"
      borderColor={borderColor}
      transition="background 0.1s"
      _hover={{ bg: hoverBg }}
      role="group"
      onClick={onOpen}
    >
      {/* Name + desc */}
      <HStack gap={3} minW={0}>
        <Box
          flexShrink={0}
          w="32px"
          h="32px"
          borderRadius="md"
          display="flex"
          alignItems="center"
          justifyContent="center"
          style={{ background: bg }}
        >
          <FolderGlyph size={18} color="rgba(255,255,255,0.9)" />
        </Box>
        <Box minW={0}>
          <Text
            fontFamily="heading"
            fontSize="md"
            fontWeight="700"
            lineClamp={1}
            color="theme.text"
          >
            {c.title}
          </Text>
          <Text fontSize="12px" color="theme.textSecondary" lineClamp={1}>{c.summary}</Text>
        </Box>
      </HStack>

      <Text fontFamily="mono" fontSize="12px" color="theme.textMuted">
        {c.item_count} items
      </Text>

      <Text fontFamily="mono" fontSize="12px" color="theme.textMuted" lineClamp={1}>
        {relativeTime(c.updated_at)}
      </Text>

      <Box
        color="theme.accent"
        transition="transform 0.1s"
        _groupHover={{ transform: 'translateX(3px)' }}
      >
        <ChevronRight size={16} />
      </Box>
    </Box>
  );
}

// ---- folder row (inside collection) ----------------------------------------

interface FolderRowProps {
  item: LibraryItem & { is_folder: true };
  childCount: number;
  onOpen: () => void;
}

function FolderRow({ item, childCount, onOpen }: FolderRowProps) {
  const borderColor = useColorModeValue('border.default', 'border.default');
  const hoverBg = useColorModeValue('bg.subtle', 'bg.subtle');

  return (
    <Box
      className="cex-folder-row"
      display="grid"
      gridTemplateColumns="minmax(0,1fr) 90px 120px 28px"
      alignItems="center"
      gap={4}
      px={4}
      py={3}
      cursor="pointer"
      borderBottom="1px solid"
      borderColor={borderColor}
      transition="background 0.1s"
      _hover={{ bg: hoverBg }}
      role="group"
      onClick={onOpen}
    >
      <HStack gap={3} minW={0}>
        <Box flexShrink={0} color="theme.textMuted">
          <FolderGlyph size={28} color="currentColor" />
        </Box>
        <HStack gap={2}>
          <Text fontFamily="heading" fontSize="md" fontWeight="700" color="theme.text" lineClamp={1}>
            {item.title}
          </Text>
          <Badge fontSize="10px" fontFamily="mono" variant="subtle" colorPalette="gray">
            Folder
          </Badge>
        </HStack>
      </HStack>

      <Text fontFamily="mono" fontSize="12px" color="theme.textMuted">
        {childCount} items
      </Text>

      <Text fontFamily="mono" fontSize="12px" color="theme.textMuted">
        {relativeTime(item.updated_at)}
      </Text>

      <Box
        color="theme.accent"
        transition="transform 0.1s"
        _groupHover={{ transform: 'translateX(3px)' }}
      >
        <ChevronRight size={16} />
      </Box>
    </Box>
  );
}

// ---- folder card (grid view) ------------------------------------------------

interface FolderCardProps {
  item: LibraryItem & { is_folder: true };
  childCount: number;
  onOpen: () => void;
}

function FolderCard({ item, childCount, onOpen }: FolderCardProps) {
  return (
    <Box
      display="flex"
      alignItems="center"
      gap={3}
      px={4}
      py={3}
      borderRadius="xl"
      border="1px solid"
      borderColor="border.default"
      bg="bg.surface"
      cursor="pointer"
      transition="transform 0.12s, box-shadow 0.12s, border-color 0.12s"
      _hover={{ transform: 'translateY(-2px)', boxShadow: 'md', borderColor: 'theme.accent' }}
      role="group"
      onClick={onOpen}
    >
      <Box color="theme.textMuted" flexShrink={0}>
        <FolderGlyph size={32} color="currentColor" />
      </Box>
      <Box flex={1} minW={0}>
        <Text fontFamily="heading" fontSize="md" fontWeight="700" lineClamp={1} color="theme.text">
          {item.title}
        </Text>
        <Text fontFamily="mono" fontSize="11px" color="theme.textMuted">
          {childCount} items · {relativeTime(item.updated_at)}
        </Text>
      </Box>
      <Box color="theme.accent" flexShrink={0} transition="transform 0.1s" _groupHover={{ transform: 'translateX(3px)' }}>
        <ChevronRight size={16} />
      </Box>
    </Box>
  );
}

// ---- file row ---------------------------------------------------------------

interface FileRowProps {
  item: LibraryItem;
  onPreview: () => void;
}

function FileRow({ item, onPreview }: FileRowProps) {
  const typeInfo = getItemTypeInfo(item);
  const name = getItemDisplayName(item);
  const size = getItemSize(item);
  const borderColor = useColorModeValue('border.default', 'border.default');
  const hoverBg = useColorModeValue('bg.subtle', 'bg.subtle');

  return (
    <Box
      display="grid"
      gridTemplateColumns="minmax(0,1fr) 130px 100px 56px"
      alignItems="center"
      gap={4}
      px={4}
      py={2.5}
      borderBottom="1px solid"
      borderColor={borderColor}
      transition="background 0.1s"
      _hover={{ bg: hoverBg }}
      role="group"
      cursor="pointer"
      onClick={onPreview}
    >
      <HStack gap={3} minW={0}>
        <FileTypeIcon info={typeInfo} size={20} />
        <Text fontSize="13px" color="theme.text" lineClamp={1}>{name}</Text>
      </HStack>

      <FileTypePill info={typeInfo} />
      <Text fontFamily="mono" fontSize="11px" color="theme.textMuted">{size}</Text>

      <HStack
        gap={1}
        justify="flex-end"
        visibility="hidden"
        _groupHover={{ visibility: 'visible' }}
      >
        <IconButton
          aria-label="Preview"
          size="xs"
          variant="ghost"
          color="theme.textSecondary"
          _hover={{ color: 'theme.accent' }}
          onClick={(e) => { e.stopPropagation(); onPreview(); }}
        >
          <Eye size={15} />
        </IconButton>
        <IconButton
          aria-label="Download"
          size="xs"
          variant="ghost"
          color="theme.textSecondary"
          _hover={{ color: 'theme.accent' }}
          onClick={(e) => e.stopPropagation()}
        >
          <Download size={15} />
        </IconButton>
      </HStack>
    </Box>
  );
}

// ---- file card (grid view) --------------------------------------------------

function FileCard({ item, onPreview }: FileRowProps) {
  const typeInfo = getItemTypeInfo(item);
  const name = getItemDisplayName(item);
  const size = getItemSize(item);

  return (
    <Box
      display="flex"
      alignItems="center"
      gap={3}
      px={4}
      py={3}
      borderRadius="xl"
      border="1px solid"
      borderColor="border.default"
      bg="bg.surface"
      transition="box-shadow 0.12s"
      _hover={{ boxShadow: 'sm' }}
      role="group"
      cursor="pointer"
      onClick={onPreview}
    >
      <FileTypeIcon info={typeInfo} size={26} />
      <Box flex={1} minW={0}>
        <Text fontSize="13px" fontWeight="500" color="theme.text" lineClamp={1} mb={1}>{name}</Text>
        <HStack gap={2}>
          <FileTypePill info={typeInfo} />
          {size && (
            <Text fontFamily="mono" fontSize="11px" color="theme.textMuted">{size}</Text>
          )}
        </HStack>
      </Box>
      <HStack
        gap={1}
        visibility="hidden"
        _groupHover={{ visibility: 'visible' }}
      >
        <IconButton
          aria-label="Preview"
          size="xs"
          variant="ghost"
          color="theme.textSecondary"
          _hover={{ color: 'theme.accent' }}
          onClick={(e) => { e.stopPropagation(); onPreview(); }}
        >
          <Eye size={15} />
        </IconButton>
        <IconButton
          aria-label="Download"
          size="xs"
          variant="ghost"
          color="theme.textSecondary"
          _hover={{ color: 'theme.accent' }}
          onClick={(e) => e.stopPropagation()}
        >
          <Download size={15} />
        </IconButton>
      </HStack>
    </Box>
  );
}

// ---- empty state ------------------------------------------------------------

function Empty({ q }: { q: string }) {
  return (
    <Box textAlign="center" py={16} px={8}>
      <Text fontFamily="mono" fontSize="12px" letterSpacing="0.08em" textTransform="uppercase" color="theme.textMuted">
        {q ? `No matches for "${q}"` : 'Nothing here yet'}
      </Text>
    </Box>
  );
}

// ---- section label ----------------------------------------------------------

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      fontFamily="mono"
      fontSize="10px"
      fontWeight="600"
      letterSpacing="0.12em"
      textTransform="uppercase"
      color="theme.textMuted"
      px={4}
      py={2}
      borderBottom="1px solid"
      borderColor="border.default"
      bg="bg.subtle"
      display="block"
    >
      {children}
    </Text>
  );
}

// ---- All Collections view --------------------------------------------------

interface AllCollectionsViewProps {
  collections: CollectionListItem[];
  mode: 'list' | 'grid';
  q: string;
  onOpen: (id: string) => void;
}

function AllCollectionsView({ collections, mode, q, onOpen }: AllCollectionsViewProps) {
  const ql = q.trim().toLowerCase();
  const filtered = ql
    ? collections.filter(
        (c) =>
          c.title.toLowerCase().includes(ql) ||
          c.summary.toLowerCase().includes(ql)
      )
    : collections;

  if (filtered.length === 0) return <Empty q={q} />;

  if (mode === 'grid') {
    return (
      <Box p={5}>
        <Grid
          templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' }}
          gap={4}
        >
          {filtered.map((c) => (
            <CollectionCard key={c.id} c={c} onOpen={() => onOpen(c.id)} />
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* Column headers */}
      <Box
        display="grid"
        gridTemplateColumns="minmax(0,1fr) 90px 120px 28px"
        gap={4}
        px={4}
        py={2}
        borderBottom="1px solid"
        borderColor="border.default"
        bg="bg.subtle"
      >
        <Text fontFamily="mono" fontSize="10px" fontWeight="600" letterSpacing="0.1em" textTransform="uppercase" color="theme.textMuted">Collection</Text>
        <Text fontFamily="mono" fontSize="10px" fontWeight="600" letterSpacing="0.1em" textTransform="uppercase" color="theme.textMuted">Contents</Text>
        <Text fontFamily="mono" fontSize="10px" fontWeight="600" letterSpacing="0.1em" textTransform="uppercase" color="theme.textMuted">Updated</Text>
        <Box />
      </Box>
      {filtered.map((c) => (
        <CollectionRow key={c.id} c={c} onOpen={() => onOpen(c.id)} />
      ))}
    </Box>
  );
}

// ---- Collection content view -----------------------------------------------

interface CollectionContentViewProps {
  collectionId: string;
  mode: 'list' | 'grid';
  q: string;
  onOpenFolder: (folderId: string) => void;
  onOpenItem: (item: LibraryItem) => void;
  refreshKey?: number;
}

function CollectionContentView({
  collectionId,
  mode,
  q,
  onOpenFolder,
  onOpenItem,
}: CollectionContentViewProps) {
  const { items, isLoading } = useCollectionItems(collectionId);
  const ql = q.trim().toLowerCase();

  const topFolders = useMemo(
    () => items.filter((i): i is LibraryItem & { is_folder: true } => i.is_folder && !i.parent_id),
    [items]
  );

  const topFiles = useMemo(
    () => items.filter((i) => !i.is_folder && !i.parent_id),
    [items]
  );

  const filteredFolders = ql
    ? topFolders.filter((fo) => fo.title.toLowerCase().includes(ql))
    : topFolders;

  const filteredFiles = ql
    ? topFiles.filter((f) => getItemDisplayName(f).toLowerCase().includes(ql))
    : topFiles;

  const childCountFor = (folderId: string) =>
    items.filter((i) => !i.is_folder && i.parent_id === folderId).length;

  if (isLoading) {
    return (
      <Box py={16} textAlign="center">
        <Spinner size="md" color="theme.accent" />
      </Box>
    );
  }

  if (filteredFolders.length === 0 && filteredFiles.length === 0) {
    return <Empty q={q} />;
  }

  if (mode === 'grid') {
    return (
      <Box p={5}>
        {filteredFolders.length > 0 && (
          <>
            <Text fontFamily="mono" fontSize="10px" fontWeight="600" letterSpacing="0.12em" textTransform="uppercase" color="theme.textMuted" mb={3}>
              Folders
            </Text>
            <VStack gap={2} align="stretch" mb={6}>
              {filteredFolders.map((fo) => (
                <FolderCard
                  key={fo.id}
                  item={fo}
                  childCount={childCountFor(fo.id)}
                  onOpen={() => onOpenFolder(fo.id)}
                />
              ))}
            </VStack>
          </>
        )}

        {filteredFiles.length > 0 && (
          <>
            <Text fontFamily="mono" fontSize="10px" fontWeight="600" letterSpacing="0.12em" textTransform="uppercase" color="theme.textMuted" mb={3}>
              Files
            </Text>
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={3}>
              {filteredFiles.map((file) => (
                <FileCard key={file.id} item={file} onPreview={() => onOpenItem(file)} />
              ))}
            </Grid>
          </>
        )}
      </Box>
    );
  }

  return (
    <Box>
      {filteredFolders.length > 0 && (
        <>
          <SectionLabel>Folders</SectionLabel>
          {filteredFolders.map((fo) => (
            <FolderRow
              key={fo.id}
              item={fo}
              childCount={childCountFor(fo.id)}
              onOpen={() => onOpenFolder(fo.id)}
            />
          ))}
        </>
      )}

      {filteredFiles.length > 0 && (
        <>
          <SectionLabel>Files</SectionLabel>
          {filteredFiles.map((file) => (
            <FileRow key={file.id} item={file} onPreview={() => onOpenItem(file)} />
          ))}
        </>
      )}
    </Box>
  );
}

// ---- Folder content view ---------------------------------------------------

interface FolderContentViewProps {
  collectionId: string;
  folderId: string;
  mode: 'list' | 'grid';
  q: string;
  onOpenItem: (item: LibraryItem) => void;
}

function FolderContentView({ collectionId, folderId, mode, q, onOpenItem }: FolderContentViewProps) {
  const { items, isLoading } = useCollectionItems(collectionId);
  const ql = q.trim().toLowerCase();

  const folderFiles = useMemo(
    () => items.filter((i) => !i.is_folder && i.parent_id === folderId),
    [items, folderId]
  );

  const filteredFiles = ql
    ? folderFiles.filter((f) => getItemDisplayName(f).toLowerCase().includes(ql))
    : folderFiles;

  if (isLoading) {
    return (
      <Box py={16} textAlign="center">
        <Spinner size="md" color="theme.accent" />
      </Box>
    );
  }

  if (filteredFiles.length === 0) return <Empty q={q} />;

  if (mode === 'grid') {
    return (
      <Box p={5}>
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={3}>
          {filteredFiles.map((file) => (
            <FileCard key={file.id} item={file} onPreview={() => onOpenItem(file)} />
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <SectionLabel>Files</SectionLabel>
      {filteredFiles.map((file) => (
        <FileRow key={file.id} item={file} onPreview={() => onOpenItem(file)} />
      ))}
    </Box>
  );
}

// ---- Collection header (above content inside a collection) -----------------

interface CollectionHeaderProps {
  collection: CollectionListItem;
  folder: (LibraryItem & { is_folder: true }) | null;
  allItems: LibraryItem[];
  isAdmin?: boolean;
  onSaveEdit?: (title: string, summary: string) => Promise<void>;
}

function CollectionHeader({ collection, folder, allItems, isAdmin, onSaveEdit }: CollectionHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [saving, setSaving] = useState(false);

  const hue = hueForName(collection.title);
  const bg = coverGradient(hue);
  const topFileCount = allItems.filter((i) => !i.is_folder && !i.parent_id).length;
  const folderCount = allItems.filter((i) => i.is_folder && !i.parent_id).length;

  const handleStartEdit = () => {
    setEditTitle(collection.title);
    setEditSummary(collection.summary ?? '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editTitle.trim()) return;
    setSaving(true);
    try {
      await onSaveEdit?.(editTitle, editSummary);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (folder) {
    return (
      <Box
        px={5}
        py={4}
        borderBottom="1px solid"
        borderColor="border.default"
        display="flex"
        alignItems="center"
        gap={4}
      >
        <Box
          flexShrink={0}
          w="42px"
          h="42px"
          borderRadius="lg"
          display="flex"
          alignItems="center"
          justifyContent="center"
          style={{ background: bg }}
        >
          <FolderGlyph size={24} color="rgba(255,255,255,0.9)" />
        </Box>
        <Box>
          <Text fontFamily="heading" fontSize="xl" fontWeight="700" color="theme.text" lineHeight="1.2">
            {folder.title}
          </Text>
          <Text fontFamily="mono" fontSize="11px" color="theme.textMuted" mt={0.5}>
            in {collection.title}
          </Text>
        </Box>
      </Box>
    );
  }

  if (isEditing) {
    return (
      <Box px={5} py={4} borderBottom="1px solid" borderColor="border.default">
        <VStack align="stretch" gap={3} maxW="480px">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            size="sm"
            fontFamily="heading"
            fontSize="md"
            placeholder="Collection title"
          />
          <Textarea
            value={editSummary}
            onChange={(e) => setEditSummary(e.target.value)}
            size="sm"
            rows={2}
            placeholder="Summary (optional)"
            fontSize="13px"
          />
          <HStack gap={2}>
            <Button size="xs" onClick={handleSave} loading={saving} colorPalette="orange" variant="subtle">
              <Check size={12} />
              Save
            </Button>
            <Button size="xs" variant="ghost" onClick={() => setIsEditing(false)}>
              <X size={12} />
              Cancel
            </Button>
          </HStack>
        </VStack>
      </Box>
    );
  }

  return (
    <Box
      px={5}
      py={4}
      borderBottom="1px solid"
      borderColor="border.default"
      display="flex"
      alignItems="center"
      gap={4}
    >
      <Box
        flexShrink={0}
        w="48px"
        h="48px"
        borderRadius="lg"
        display="flex"
        alignItems="center"
        justifyContent="center"
        style={{ background: bg }}
      >
        <CoverFolder size={36} />
      </Box>
      <Box flex={1} minW={0}>
        <Text fontFamily="heading" fontSize="xl" fontWeight="700" color="theme.text" lineHeight="1.2">
          {collection.title}
        </Text>
        {collection.summary && (
          <Text fontSize="13px" color="theme.textSecondary" mt={0.5} lineClamp={1}>{collection.summary}</Text>
        )}
        <HStack gap={3} mt={1.5} fontFamily="mono" fontSize="11px" color="theme.textMuted">
          <Text>{topFileCount} files</Text>
          {folderCount > 0 && <Text>· {folderCount} folders</Text>}
          <Text>· Updated {relativeTime(collection.updated_at)}</Text>
        </HStack>
      </Box>
      {isAdmin && onSaveEdit && (
        <IconButton
          aria-label="Edit collection"
          size="xs"
          variant="ghost"
          color="theme.textSecondary"
          _hover={{ color: 'theme.text' }}
          onClick={handleStartEdit}
          flexShrink={0}
        >
          <Pencil size={14} />
        </IconButton>
      )}
    </Box>
  );
}

// ---- admin section (inside a collection) -----------------------------------

interface AdminSectionProps {
  collectionId: string;
  onItemAdded: () => void;
  onDelete: () => void;
  deleteLoading: boolean;
}

function AdminSection({ collectionId, onItemAdded, onDelete, deleteLoading }: AdminSectionProps) {
  const borderColor = useColorModeValue('border.default', 'border.default');

  return (
    <Box
      className="cex-admin-section"
      borderTop="2px solid"
      borderColor="orange.200"
      mt={4}
      px={5}
      py={5}
    >
      {/* Add items */}
      <Box mb={8}>
        <Text
          fontFamily="mono"
          fontSize="10px"
          fontWeight="600"
          letterSpacing="0.12em"
          textTransform="uppercase"
          color="theme.textMuted"
          mb={3}
        >
          Add to collection
        </Text>
        <CollectionBrowser collectionId={collectionId} onItemAdded={onItemAdded} />
      </Box>

      {/* Delete zone */}
      <Box pt={5} borderTop="1px solid" borderColor={borderColor}>
        <Text
          fontFamily="mono"
          fontSize="10px"
          fontWeight="600"
          letterSpacing="0.12em"
          textTransform="uppercase"
          color="theme.textMuted"
          mb={2}
        >
          Delete collection
        </Text>
        <Text fontSize="12px" color="theme.textSecondary" mb={3} lineHeight="1.6">
          Removes all items from this collection. The underlying files are not deleted.
        </Text>
        <Button
          size="xs"
          variant="outline"
          colorPalette="red"
          onClick={onDelete}
          loading={deleteLoading}
        >
          <Trash2 size={12} />
          Delete collection
        </Button>
      </Box>
    </Box>
  );
}

// ---- create collection form ------------------------------------------------

interface CreateFormProps {
  sponsor: SponsorInfo;
  onCreated: () => void;
  onCancel: () => void;
}

function CreateForm({ sponsor, onCreated, onCancel }: CreateFormProps) {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const createMutation = useCreateCollection();
  const borderColor = useColorModeValue('border.default', 'border.default');

  const handleCreate = async () => {
    if (!title.trim()) return;
    try {
      await createMutation.mutateAsync({
        title,
        summary,
        sponsor_type: sponsor.type,
        sponsor_id: sponsor.id,
      });
      toaster.create({ title: 'Collection created', type: 'success' });
      onCreated();
    } catch {
      toaster.create({ title: 'Failed to create collection', type: 'error' });
    }
  };

  return (
    <Box
      className="cex-create-form"
      px={4}
      py={4}
      borderBottom="1px solid"
      borderColor={borderColor}
      bg="bg.subtle"
    >
      <VStack align="stretch" gap={3} maxW="480px">
        <Text fontFamily="mono" fontSize="10px" fontWeight="600" letterSpacing="0.12em" textTransform="uppercase" color="theme.textMuted">
          New collection
        </Text>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Collection title"
          size="sm"
          autoFocus
        />
        <Textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Summary (optional)"
          size="sm"
          rows={2}
          fontSize="13px"
        />
        <HStack gap={2}>
          <Button size="xs" colorPalette="orange" variant="subtle" onClick={handleCreate} loading={createMutation.isPending}>
            <Check size={12} />
            Create
          </Button>
          <Button size="xs" variant="ghost" onClick={onCancel}>
            <X size={12} />
            Cancel
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}

// ---- main shell ------------------------------------------------------------

// Remembers where the member last was within a sponsor's collections —
// collection, folder, and the file/post they had open — so returning to the
// tab picks up where they left off instead of always landing on "All Collections".
function lastNavStorageKey(sponsor: SponsorInfo) {
  return `mixtape:collections:lastNav:${sponsor.type}:${sponsor.id}`;
}

interface StoredNav {
  collectionId: string | null;
  folderId: string | null;
  previewItemId: string | null;
}

function readStoredNav(sponsor: SponsorInfo): StoredNav | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(lastNavStorageKey(sponsor));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredNav>;
    return {
      collectionId: parsed.collectionId ?? null,
      folderId: parsed.folderId ?? null,
      previewItemId: parsed.previewItemId ?? null,
    };
  } catch {
    return null;
  }
}

export function CollectionsExplorer({ sponsor, initialCollectionId, isAdmin = false }: CollectionsExplorerProps) {
  const [nav, setNav] = useState<ExplorerNav>(() => {
    if (initialCollectionId) return { collectionId: initialCollectionId, folderId: null };
    const stored = readStoredNav(sponsor);
    return stored ? { collectionId: stored.collectionId, folderId: stored.folderId } : { collectionId: null, folderId: null };
  });
  const [q, setQ] = useState('');
  const [previewItem, setPreviewItem] = useState<LibraryItem | null>(null);
  const [mode, setMode] = useViewMode();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [itemsRefreshKey, setItemsRefreshKey] = useState(0);

  const updateMutation = useUpdateCollection();
  const deleteMutation = useDeleteCollection();

  // The previewed item's id can only be resolved once its collection's items
  // have loaded, so the restore happens in an effect keyed off activeItems below.
  const pendingPreviewIdRef = useRef<string | null>(readStoredNav(sponsor)?.previewItemId ?? null);

  const { collections, isLoading: collectionsLoading } = useCollections({
    sponsor_type: sponsor.type,
    sponsor_id: sponsor.id,
  });

  const sponsorCollections = useMemo(
    () => collections.filter((c) => c.sponsor_type === sponsor.type && c.sponsor_id === sponsor.id),
    [collections, sponsor]
  );

  const { items: activeItems } = useCollectionItems(nav.collectionId);

  const activeCollection = sponsorCollections.find((c) => c.id === nav.collectionId) ?? null;

  const activeFolder = useMemo((): (LibraryItem & { is_folder: true }) | null => {
    if (!nav.folderId) return null;
    const found = activeItems.find((i) => i.is_folder && i.id === nav.folderId);
    return found && found.is_folder ? found : null;
  }, [activeItems, nav.folderId]);

  // Resolve a restored "last open file" id into the actual item once its
  // collection's items have loaded, then drop into preview just like a click would.
  useEffect(() => {
    const pendingId = pendingPreviewIdRef.current;
    if (!pendingId || activeItems.length === 0) return;
    pendingPreviewIdRef.current = null;
    const found = activeItems.find((i) => i.id === pendingId);
    if (found && !found.is_folder) setPreviewItem(found);
  }, [activeItems]);

  // Persist collection / folder / open-item so returning to this tab resumes here.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const toStore: StoredNav = {
        collectionId: nav.collectionId,
        folderId: nav.folderId,
        previewItemId: previewItem?.id ?? null,
      };
      window.localStorage.setItem(lastNavStorageKey(sponsor), JSON.stringify(toStore));
    } catch {
      // localStorage unavailable (private mode, quota) — resume position is best-effort.
    }
  }, [sponsor, nav, previewItem]);

  const go = useCallback((next: ExplorerNav) => {
    setNav(next);
    setQ('');
  }, []);

  const handleSaveEdit = useCallback(async (title: string, summary: string) => {
    if (!nav.collectionId) return;
    try {
      await updateMutation.mutateAsync({ collectionId: nav.collectionId, data: { title, summary } });
      toaster.create({ title: 'Collection updated', type: 'success' });
    } catch {
      toaster.create({ title: 'Failed to update collection', type: 'error' });
      throw new Error('update failed');
    }
  }, [nav.collectionId, updateMutation]);

  const handleDelete = useCallback(async () => {
    if (!nav.collectionId) return;
    if (!confirm('Delete this collection? This cannot be undone.')) return;
    try {
      await deleteMutation.mutateAsync(nav.collectionId);
      toaster.create({ title: 'Collection deleted', type: 'success' });
      go({ collectionId: null, folderId: null });
    } catch {
      toaster.create({ title: 'Failed to delete collection', type: 'error' });
    }
  }, [nav.collectionId, deleteMutation, go]);

  // Browser back / Escape from inside a collection returns to the collections list
  const detailNav = useBackNavigableDetail({
    isOpen: nav.collectionId !== null,
    onClose: () => {
      setPreviewItem(null);
      go({ collectionId: null, folderId: null });
    },
    tagKey: 'collectionDetail',
  });

  // Routes collection-level entry/exit through detailNav so the synthetic
  // history entry stays in sync; folder navigation within a collection passes through untouched.
  const goNav = useCallback(
    (next: ExplorerNav) => {
      const enteringCollection = next.collectionId !== null && nav.collectionId === null;
      const leavingCollection = next.collectionId === null && nav.collectionId !== null;
      if (enteringCollection) {
        detailNav.enter(() => go(next));
      } else if (leavingCollection) {
        detailNav.exit();
      } else {
        go(next);
      }
    },
    [nav.collectionId, go, detailNav]
  );

  const panelBg = useColorModeValue('bg.surface', 'bg.surface');
  const borderColor = useColorModeValue('border.default', 'border.default');

  if (previewItem) {
    return (
      <Box p={5}>
        <CollectionItemReader
          item={previewItem}
          onBack={() => setPreviewItem(null)}
          groupSlug={sponsor.type === 'group' ? sponsor.slug : undefined}
        />
      </Box>
    );
  }

  if (collectionsLoading) {
    return (
      <Box py={16} textAlign="center">
        <Spinner size="md" color="theme.accent" />
        <Text fontFamily="mono" fontSize="12px" letterSpacing="0.08em" textTransform="uppercase" color="theme.textMuted" mt={3}>
          Loading collections…
        </Text>
      </Box>
    );
  }

  return (
    <Box
      className="cex-shell"
      bg={panelBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="xl"
      overflow="hidden"
      display="flex"
      flexDir="column"
      minH="520px"
    >
      <Flex flex={1} overflow="hidden">
        {/* Sidebar */}
        <Sidebar
          collections={sponsorCollections}
          nav={nav}
          folderItems={activeItems}
          onNav={goNav}
        />

        {/* Main area */}
        <Flex flex={1} flexDir="column" minW={0} overflow="hidden">
          {/* Top bar */}
          <Topbar
            nav={nav}
            collection={activeCollection}
            folder={activeFolder}
            onNav={goNav}
            mode={mode}
            onModeChange={setMode}
            q={q}
            onQ={setQ}
            isAdmin={isAdmin}
            onNew={() => setShowCreateForm(true)}
          />

          {/* Admin: create collection form */}
          {isAdmin && showCreateForm && !nav.collectionId && (
            <CreateForm
              sponsor={sponsor}
              onCreated={() => { setShowCreateForm(false); }}
              onCancel={() => setShowCreateForm(false)}
            />
          )}

          {/* Collection / folder header */}
          <AnimatePresence mode="wait">
            {activeCollection && (
              <motion.div
                key={`header-${nav.collectionId}-${nav.folderId}`}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <CollectionHeader
                  collection={activeCollection}
                  folder={activeFolder}
                  allItems={activeItems}
                  isAdmin={isAdmin}
                  onSaveEdit={isAdmin ? handleSaveEdit : undefined}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content */}
          <Box flex={1} overflowY="auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={`content-${nav.collectionId ?? 'root'}-${nav.folderId ?? 'root'}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {!nav.collectionId && (
                  <AllCollectionsView
                    collections={sponsorCollections}
                    mode={mode}
                    q={q}
                    onOpen={(id) => goNav({ collectionId: id, folderId: null })}
                  />
                )}

                {nav.collectionId && !nav.folderId && (
                  <>
                    <CollectionContentView
                      collectionId={nav.collectionId}
                      mode={mode}
                      q={q}
                      onOpenFolder={(fid) => go({ collectionId: nav.collectionId!, folderId: fid })}
                      onOpenItem={setPreviewItem}
                      refreshKey={itemsRefreshKey}
                    />
                    {isAdmin && (
                      <AdminSection
                        collectionId={nav.collectionId}
                        onItemAdded={() => setItemsRefreshKey((k) => k + 1)}
                        onDelete={handleDelete}
                        deleteLoading={deleteMutation.isPending}
                      />
                    )}
                  </>
                )}

                {nav.collectionId && nav.folderId && (
                  <FolderContentView
                    collectionId={nav.collectionId}
                    folderId={nav.folderId}
                    mode={mode}
                    q={q}
                    onOpenItem={setPreviewItem}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </Box>
        </Flex>
      </Flex>
    </Box>
  );
}
