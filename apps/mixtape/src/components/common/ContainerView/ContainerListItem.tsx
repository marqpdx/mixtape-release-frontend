// ContainerListItem.tsx

"use client"

import type { ReactNode } from "react"
import { Box, Flex, Text } from "@chakra-ui/react"
import {
  MenuRoot,
  MenuTrigger,
  MenuContent,
  MenuItem,
} from "@chakra-ui/react"
import { useColorModeValue } from "@components/ui/color-mode"
import { IconButton } from "@chakra-ui/react"
import { IconDotsVertical, IconTrash, IconFileText } from "@tabler/icons-react"
import type { ContainerItem, ContainerAction } from "./ContainerView.types"

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

interface ContainerListItemProps<T extends ContainerItem> {
  item: T
  onItemClick?: (item: T) => void
  onRemoveItem?: (item: T) => void
  actions?: ContainerAction<T>[]
  renderBadge?: (item: T) => ReactNode
}

export function ContainerListItem<T extends ContainerItem>({
  item,
  onItemClick,
  onRemoveItem,
  actions,
  renderBadge,
}: ContainerListItemProps<T>) {
  const hoverBg = useColorModeValue("gray.50", "gray.750")
  const borderColor = useColorModeValue("gray.100", "gray.700")
  const mutedText = useColorModeValue("gray.500", "gray.400")

  const visibleActions = actions?.filter((a) => !a.showIf || a.showIf(item)) ?? []
  const hasMenu = visibleActions.length > 0 || !!onRemoveItem

  return (
    <Flex
      align="center"
      gap={3}
      py={3}
      px={3}
      borderBottom="1px solid"
      borderColor={borderColor}
      cursor={onItemClick ? "pointer" : undefined}
      onClick={() => onItemClick?.(item)}
      _hover={onItemClick ? { bg: hoverBg } : undefined}
      transition="background 0.15s"
    >
      <Box flexShrink={0} color={mutedText}>
        <IconFileText size={18} />
      </Box>

      <Box flex={1} minW={0}>
        <Text fontSize="sm" fontWeight="medium" lineClamp={1}>
          {item.title}
        </Text>
        {item.subtitle && (
          <Text fontSize="xs" color={mutedText} lineClamp={1}>
            {item.subtitle}
          </Text>
        )}
      </Box>

      {renderBadge && <Box flexShrink={0}>{renderBadge(item)}</Box>}

      {item.date && (
        <Text fontSize="xs" color={mutedText} flexShrink={0} whiteSpace="nowrap">
          {relativeDate(item.date)}
        </Text>
      )}

      {hasMenu && (
        <Box onClick={(e) => e.stopPropagation()} flexShrink={0}>
          <MenuRoot positioning={{ placement: "bottom-end" }}>
            <MenuTrigger asChild>
              <IconButton
                aria-label="Item actions"
                variant="ghost"
                size="xs"
              >
                <IconDotsVertical size={14} />
              </IconButton>
            </MenuTrigger>
            <MenuContent>
              {visibleActions.map((action) => (
                <MenuItem
                  key={action.label}
                  value={action.label}
                  color={action.isDanger ? "red.500" : undefined}
                  onClick={() => action.onClick(item)}
                >
                  {action.icon} {action.label}
                </MenuItem>
              ))}
              {onRemoveItem && (
                <MenuItem
                  value="remove"
                  color="red.500"
                  onClick={() => onRemoveItem(item)}
                >
                  <IconTrash size={14} /> Remove
                </MenuItem>
              )}
            </MenuContent>
          </MenuRoot>
        </Box>
      )}
    </Flex>
  )
}
