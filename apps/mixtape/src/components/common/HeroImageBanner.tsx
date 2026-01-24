// src/components/common/HeroImageBanner.tsx

"use client";

import { Box, Flex, Image, Text } from "@chakra-ui/react";

type OverlayPosition =
  | "TopLeft" | "TopCenter" | "TopRight"
  | "MidLeft" | "MidCenter" | "MidRight"
  | "BottomLeft" | "BottomCenter" | "BottomRight";

interface HeroImageBannerProps {
  backgroundImage?: string;
  profileImage?: string;
  title?: string;
  position?: OverlayPosition;
}

export default function HeroImageBanner({
  backgroundImage,
  profileImage,
  title,
  position = "MidCenter",
}: HeroImageBannerProps) {

  // Map position to Chakra's justifyContent values
  const justifyMap: Record<OverlayPosition, string> = {
    TopLeft: "flex-start",
    TopCenter: "center",
    TopRight: "flex-end",
    MidLeft: "flex-start",
    MidCenter: "center",
    MidRight: "flex-end",
    BottomLeft: "flex-start",
    BottomCenter: "center",
    BottomRight: "flex-end",
  };

  const alignMap: Record<OverlayPosition, string> = {
    TopLeft: "flex-start",
    TopCenter: "flex-start",
    TopRight: "flex-start",
    MidLeft: "center",
    MidCenter: "center",
    MidRight: "center",
    BottomLeft: "flex-end",
    BottomCenter: "flex-end",
    BottomRight: "flex-end",
  };

  return (
    <Box position="relative">
      {/* ✅ Background Image */}
      {backgroundImage && (
        <Box
          w="100%"
          h="50vh"
          bgImage={`url(${backgroundImage})`}
          bgSize="cover"
          bgPos="center"
          borderRadius="md"
          overflow="hidden"
        />
      )}

      {/* ✅ Title Overlay */}
      {title && (
        <Flex
          position="absolute"
          top={0}
          left={0}
          w="100%"
          h="100%"
          px={6}
          zIndex={2}
          justify={justifyMap[position]}
          align={alignMap[position]}
        >
          <Box
            bg="blackAlpha.500"
            px={6}
            py={4}
            borderRadius="xl"
            maxW="90%"
          >
            <Text fontSize="2xl" fontWeight="bold" color="white" textAlign="center">
              {title}
            </Text>
          </Box>
        </Flex>
      )}

      {/* ⏸️ Profile Image Overlay */}
      {false && profileImage && (
        <Image
          src={profileImage}
          alt="Profile Image"
          width="150px"
          height="150px"
          borderRadius="full"
          border="4px solid white"
          position="absolute"
          top="180px"
          left="50%"
          transform="translateX(-50%)"
          zIndex={3}
        />
      )}
    </Box>
  );


  // return (
  //   <Box position="relative">
  //     {/* ✅ Full-Width Background Image */}
  //     {backgroundImage && (
  //       <Box
  //         w="100%"
  //         h="50vh"
  //         bgImage={`url(${backgroundImage})`}
  //         bgSize="cover"
  //         bgPos="center"
  //         borderRadius="md"
  //         overflow="hidden"
  //       />
  //     )}

  //     {/* ✅ Title Overlay */}
  //     {title && (
  //       <Flex
  //         position="absolute"
  //         top={0}
  //         left={0}
  //         w="100%"
  //         h="100%"
  //         align="center"
  //         justify={alignmentMap[position]}
  //         px={6}
  //         zIndex={2}
  //       >
  //         <Box
  //           bg="blackAlpha.600"
  //           px={6}
  //           py={4}
  //           borderRadius="md"
  //           maxW="90%"
  //         >
  //           <Text fontSize="2xl" fontWeight="bold" color="white" textAlign="center">
  //             {title}
  //           </Text>
  //         </Box>
  //       </Flex>
  //     )}

  //     {/* ⏸️ Future Profile Image Overlay */}
  //     {false && profileImage && (
  //       <Image
  //         src={profileImage}
  //         alt="Profile Image"
  //         width="150px"
  //         height="150px"
  //         borderRadius="full"
  //         border="4px solid white"
  //         position="absolute"
  //         top="180px"
  //         left="50%"
  //         transform="translateX(-50%)"
  //         zIndex={3}
  //       />
  //     )}
  //   </Box>
  // );

  // return (
  //   <Box position="relative" x-mb={20}>
  //     {/* ✅ Full-Width Background Image */}
  //     {backgroundImage && (
  //       <Box
  //         w="100%"
  //         h="50vh"
  //         bgImage={`url(${backgroundImage})`}
  //         bgSize="cover"
  //         bgPos="center"
  //         borderRadius="md"
  //         overflow="hidden"
  //       />
  //     )}

  //     {/* ✅ Rounded Profile Image Overlay */}
  //     {false && profileImage && (
  //       <Image
  //         src={profileImage}
  //         alt="Profile Image"
  //         width="150px"
  //         height="150px"
  //         borderRadius="full"
  //         border="4px solid white"
  //         position="absolute"
  //         top="180px"
  //         left="50%"
  //         transform="translateX(-50%)"
  //         zIndex={1}
  //       />
  //     )}
  //   </Box>
  // );
}
