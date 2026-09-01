"use client";

// GroupPublicFooter — Decision 11: minimal platform attribution.
// "Powered by Crossroads" is a whisper, not co-branding. The Group is the tenant.

import { Box, Flex, Text } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";

interface Props {
  groupTitle: string;
}

export function GroupPublicFooter({ groupTitle }: Props) {
  const bg = useColorModeValue("white", "gray.950");
  const borderColor = useColorModeValue("gray.100", "gray.800");
  const textColor = useColorModeValue("gray.400", "gray.600");

  return (
    <Box
      className="gpl-footer"
      as="footer"
      bg={bg}
      borderTopWidth="1px"
      borderColor={borderColor}
      px={{ base: 6, md: 12, lg: 20 }}
      py={8}
    >
      <Flex className="gpl-footer-inner" justify="space-between" align="center" flexWrap="wrap" gap={3}>
        <Text fontSize="xs" color={textColor}>
          © {new Date().getFullYear()} {groupTitle}
        </Text>
        <Text fontSize="xs" color={textColor}>
          Powered by{" "}
          <Text as="span" fontWeight="500">
            Crossroads
          </Text>
        </Text>
      </Flex>
    </Box>
  );
}
