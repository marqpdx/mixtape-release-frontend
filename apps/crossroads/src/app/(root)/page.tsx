// mixtape-release-frontend/src/app/(root)/page.tsx

"use client";

import React from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Link,
} from '@chakra-ui/react';
import { IconArrowRight, IconUsers, IconLogin } from '@tabler/icons-react';
import { useColorModeValue } from '@components/ui/color-mode';
import { LuExternalLink } from "react-icons/lu";
import { CrossroadsLogo } from '@components/common/CrossroadsLogo';

export default function CrossroadsHomepage() {
  const overlayBg = useColorModeValue('whiteAlpha.200', 'blackAlpha.300');
  const textColor = useColorModeValue('white', 'white');
  const watermarkTextColor = useColorModeValue('gray.300', 'gray.400');
  const buttonColor = useColorModeValue("text.light", "text.light");
  const logoColor = useColorModeValue('black', 'white');

  const backgroundImage = "/homepage/noaa-zdj3p00Rep0-unsplash.jpg";

  return (
    <Box className="homepage-container"
      position="relative"
      width="100vw"
      height="100vh"
      backgroundImage={`url(${backgroundImage})`}
      backgroundSize="cover"
      backgroundPosition="center"
      backgroundRepeat="no-repeat"
      display="flex"
      alignItems={{ base: "center", md: "flex-end" }}
      justifyContent="center"
      pb={{ base: 4, md: "19vh" }}
      overflow="hidden"
    >
      {/* Logo in top right - MUCH SMALLER CONTAINER */}
      <Box
        position="absolute"
        top={4}
        right={4}
        zIndex={10}
        _hover={{
          transform: 'scale(1.05)',
          filter: 'drop-shadow(0 4px 12px rgba(255,255,255,0.3))'
        }}
        transition="all 0.3s ease"
      >
        <CrossroadsLogo size={280} />
      </Box>

      {/* Main Content Container */}
      <HStack
        gap={8}
        alignItems="stretch"
        maxWidth="900px"
        width="100%"
        px={4}
        flexDirection={{ base: 'column', md: 'row' }}
      >
        {/* Left Box - Content A */}
        <Box
          bg={overlayBg}
          backdropFilter="blur(10px)"
          borderRadius="xl"
          p={8}
          flex={1}
          border="1px solid"
          borderColor="whiteAlpha.300"
          _hover={{
            transform: 'translateY(-2px)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}
          transition="all 0.3s ease"
          display="flex"
          flexDirection="column"
        >
          <VStack gap={6} align="start" flex={1} mb={8}>
            <Text
              fontSize="xl"
              fontWeight="bold"
              color={textColor}
              lineHeight="tall"
            >
              Welcome to Crossroads
            </Text>
            <Text
              color={textColor}
              lineHeight="tall"
            >
              A co-created community for makers, teachers, artists, learners, botanists, writers, scientists, carers, and others.
            </Text>
          </VStack>

          <Button
            colorScheme="green"
            color={buttonColor}
            size="lg"
            _hover={{
              transform: 'translateX(4px)',
              boxShadow: '0 8px 25px rgba(72, 187, 120, 0.3)'
            }}
            transition="all 0.3s ease"
            mt="auto"
          >
            <IconArrowRight size={20} style={{ marginLeft: '8px' }} />
            <Link color={buttonColor} href='/about'>Learn More</Link>
          </Button>
        </Box>

        {/* Right Box - Content B */}
        <Box
          bg={overlayBg}
          backdropFilter="blur(10px)"
          borderRadius="xl"
          p={8}
          flex={1}
          border="1px solid"
          borderColor="whiteAlpha.300"
          _hover={{
            transform: 'translateY(-2px)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}
          transition="all 0.3s ease"
          display="flex"
          flexDirection="column"
        >
          <VStack gap={6} align="start" flex={1} mb={8}>
            <Text
              fontSize="xl"
              fontWeight="bold"
              color={textColor}
              lineHeight="tall"
            >
              Come On In
            </Text>
            <Text
              color={textColor}
              lineHeight="tall"
            >
              Explore Crossroads, share in abundance, and look into joining the community. Click below to get started.
            </Text>
          </VStack>

          <HStack gap={3} width="100%" mt="auto">
            <Button
              colorScheme="green"
              color={buttonColor}
              size="lg"
              flex={2}
              _hover={{
                transform: 'translateX(4px)',
                boxShadow: '0 8px 25px rgba(72, 187, 120, 0.3)'
              }}
              transition="all 0.3s ease"
            >
              <IconUsers size={20} style={{ marginRight: '8px' }} />
              <Link color={buttonColor} href='/about' >Explore & Join</Link>
            </Button>

            <Button
              variant="outline"
              colorScheme="green"
              color={buttonColor}
              size="lg"
              flex={1}
              borderColor="green.400"
              _hover={{
                bg: 'green.500',
                borderColor: 'green.500',
                transform: 'translateX(4px)',
                boxShadow: '0 8px 25px rgba(72, 187, 120, 0.3)'
              }}
              transition="all 0.3s ease"
            >
              <IconLogin size={20} style={{ marginRight: '8px' }} />
              <Link color={buttonColor} href='/login'>Login</Link>
            </Button>
          </HStack>
        </Box>
      </HStack>

      {/* NOAA Watermark */}
      <Box
        position="absolute"
        bottom={4}
        left={4}
        fontSize="sm"
      >
        <Link
          href="https://unsplash.com/@noaa"
          color={watermarkTextColor}
          _hover={{
            color: 'white',
            textDecoration: 'underline'
          }}
          transition="color 0.2s ease"
        >
          <Text as="span" fontWeight="bold">@noaa</Text>
          <Text as="span" ml={2}>image courtesy of NOAA</Text>
          <Box  marginLeft="4px" verticalAlign="middle">
            <LuExternalLink />
          </Box>
        </Link>
      </Box>
    </Box>
  );
}