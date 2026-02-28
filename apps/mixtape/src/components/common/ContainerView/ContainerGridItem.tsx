// ContainerGridItem.tsx

"use client"

import type { ReactNode } from "react"
import { Box, Flex, Text } from "@chakra-ui/react"
import { Card, Image } from "@chakra-ui/react"
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

interface ContainerGridItemProps<T extends ContainerItem> {
  item: T
  onItemClick?: (item: T) => void
  onRemoveItem?: (item: T) => void
  actions?: ContainerAction<T>[]
  renderBadge?: (item: T) => ReactNode
}

export function ContainerGridItem<T extends ContainerItem>({
  item,
  onItemClick,
  onRemoveItem,
  actions,
  renderBadge,
}: ContainerGridItemProps<T>) {
  const cardBg = useColorModeValue("white", "gray.800")
  const borderColor = useColorModeValue("gray.200", "gray.700")
  const hoverBg = useColorModeValue("gray.50", "gray.750")
  const iconBg = useColorModeValue("gray.50", "gray.700")
  const mutedText = useColorModeValue("gray.500", "gray.400")

  const visibleActions = actions?.filter((a) => !a.showIf || a.showIf(item)) ?? []
  const hasMenu = visibleActions.length > 0 || !!onRemoveItem

  return (
    <Card.Root
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      cursor={onItemClick ? "pointer" : undefined}
      onClick={() => onItemClick?.(item)}
      _hover={onItemClick ? { bg: hoverBg, shadow: "md" } : undefined}
      transition="all 0.2s"
    >
      <Card.Body p={3}>
        <Flex
          w="100%"
          h={20}
          bg={iconBg}
          borderRadius="md"
          align="center"
          justify="center"
          mb={3}
          overflow="hidden"
        >
          {item.thumbnail ? (
            <Box
              w="100%"
              h="100%"
              objectFit="cover"
            />
          ) : (
            <Image  src={item.thumbnail} alt={item.title}>
              <IconFileText size={32} color="var(--chakra-colors-gray-400)" />
            </Image>
          )}
        </Flex>
        <Text fontSize="sm" fontWeight="medium" lineClamp={2} mb={1}>
          {item.title}
        </Text>
        {item.subtitle && (
          <Text fontSize="xs" color={mutedText} lineClamp={2} mb={2}>
            {item.subtitle}
          </Text>
        )}
        <Flex justify="space-between" align="center">
          <Box>{renderBadge?.(item)}</Box>
          {hasMenu && (
            <Box onClick={(e) => e.stopPropagation()}>
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
      </Card.Body>
    </Card.Root>
  )
}
