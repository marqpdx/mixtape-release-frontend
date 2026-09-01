"use client";

// GroupPublicAbout — About section (Decision 1, Decision 2)

import { Box, Flex, Text, Grid } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import type { GroupPublicLandingConfig } from "../types";

interface Props {
  about: GroupPublicLandingConfig["about"];
}

export function GroupPublicAbout({ about }: Props) {
  const bg = useColorModeValue("white", "gray.900");
  const borderColor = useColorModeValue("gray.100", "gray.800");
  const labelColor = useColorModeValue("gray.500", "gray.400");
  const headingColor = useColorModeValue("gray.900", "gray.50");
  const bodyColor = useColorModeValue("gray.600", "gray.300");
  const chipBg = useColorModeValue("gray.50", "gray.800");
  const chipBorder = useColorModeValue("gray.200", "gray.700");

  return (
    <Box
      className="gpl-about"
      id="gpl-about"
      as="section"
      bg={bg}
      borderBottomWidth="1px"
      borderColor={borderColor}
      px={{ base: 6, md: 12, lg: 20 }}
      py={{ base: 16, md: 20 }}
    >
      <Text
        fontSize="xs"
        fontWeight="600"
        color={labelColor}
        textTransform="uppercase"
        letterSpacing="wider"
        mb={6}
      >
        About
      </Text>

      <Grid
        className="gpl-about-grid"
        templateColumns={{ base: "1fr", md: "1fr 1fr" }}
        gap={{ base: 8, md: 16 }}
        alignItems="start"
      >
        {about.text && (
          <Text
            className="gpl-about-text"
            fontSize={{ base: "md", md: "lg" }}
            color={bodyColor}
            lineHeight={1.7}
          >
            {about.text}
          </Text>
        )}

        {about.descriptors.length > 0 && (
          <Flex className="gpl-about-descriptors" direction="column" gap={2}>
            {about.descriptors.map((d, i) => (
              <Box
                key={i}
                px={4}
                py={3}
                bg={chipBg}
                borderWidth="1px"
                borderColor={chipBorder}
                borderRadius="md"
              >
                <Text fontSize="sm" color={headingColor} fontWeight="500">
                  {d}
                </Text>
              </Box>
            ))}
          </Flex>
        )}
      </Grid>
    </Box>
  );
}
