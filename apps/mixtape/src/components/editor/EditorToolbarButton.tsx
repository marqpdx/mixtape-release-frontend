// src/components/editor/EditorToolbarButton.tsx

import { IconButton, } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { Tooltip } from "@components/ui/tooltip";

interface EditorToolbarButtonProps {
  tooltip: string;
  icon: React.ReactNode;
  onClick: () => void;
  isActive?: boolean;
  tabIndex?: number;
  size?: "xs" | "sm" | "md" | "lg";
}

export default function EditorToolbarButton({
  tooltip,
  icon,
  onClick,
  isActive = false,
  tabIndex,
  size = "sm"
}: EditorToolbarButtonProps) {
  const activeBg = useColorModeValue("gray.200", "gray.700");
  const hoverBg = useColorModeValue("gray.100", "gray.600");
  const idleBg = useColorModeValue("gray.50", "gray.800");
  const idleColor = useColorModeValue("gray.700", "gray.200");
  const activeColor = useColorModeValue("gray.900", "whiteAlpha.900");

  return (
    <Tooltip content={tooltip}>
      <IconButton
        size={size}
        variant="ghost"
        onClick={onClick}
        tabIndex={tabIndex}
        bg={isActive ? activeBg : idleBg}
        color={isActive ? activeColor : idleColor}
        _hover={{ bg: hoverBg }}
        _active={{ bg: activeBg }}
        aria-label={tooltip}
      >
        {icon}
      </IconButton>
    </Tooltip>
  );
}
