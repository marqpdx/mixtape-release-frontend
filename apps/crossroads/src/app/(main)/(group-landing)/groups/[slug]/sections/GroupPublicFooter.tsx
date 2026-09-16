"use client";

// GroupPublicFooter — Decision 11: minimal platform attribution.
// "Powered by Crossroads" is a whisper, not co-branding. The Group is the tenant.

import { Box, Flex, Text } from "@chakra-ui/react";

interface Props {
  groupTitle: string;
}

export function GroupPublicFooter({ groupTitle }: Props) {
  return (
    <Box
      className="gpl-footer"
      as="footer"
      borderTopWidth="1px"
      px={{ base: 6, md: 12, lg: 20 }}
      py={8}
      style={{
        background: "var(--theme-bg)",
        borderColor: "var(--theme-border)",
      }}
    >
      <Flex className="gpl-footer-inner" justify="space-between" align="center" flexWrap="wrap" gap={3}>
        <Text fontSize="xs" style={{ color: "var(--theme-text-muted)" }}>
          © {new Date().getFullYear()} {groupTitle}
        </Text>
        <Text fontSize="xs" style={{ color: "var(--theme-text-muted)" }}>
          Powered by{" "}
          <Text as="span" fontWeight="500">
            Crossroads
          </Text>
        </Text>
      </Flex>
    </Box>
  );
}
