// /src/components/layout/Footer

"use client";

import {
  Box,
  Container,
  HStack,
  Link as ChakraLink,
  Text,
  Icon,
} from "@chakra-ui/react";
import { FiMail } from "react-icons/fi";
import NextLink from "next/link";

export default function Footer() {
  // Next.js
  const sha =
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
    "no-sha";

  console.log(`[Footer] Rendered - commit SHA: ${sha}`);

  return (
    <Box
      as="footer"
      mt={8}
      py={4}
      borderTop="1px solid"
      borderColor="gray.200"
    >
      <Container maxW="container.lg">
        <HStack justify="space-between" wrap="wrap">
          <HStack gap={4}>
            <ChakraLink
              as={NextLink}
              href="/contact"
              display="flex"
              alignItems="center"
            >
              <Icon as={FiMail} mr={1} />
              Contact Us
            </ChakraLink>

            <ChakraLink as={NextLink} href="/privacy">
              Privacy Policy
            </ChakraLink>

            <ChakraLink as={NextLink} href="/accessibility">
              Accessibility
            </ChakraLink>
          </HStack>

          <Text fontSize="sm" color="gray.500">
            © {new Date().getFullYear()} Mindful Brilliance
          </Text>
        </HStack>
      </Container>
    </Box>
  );
}

// // /src/components/layout/Footer

// "use client";

// import {
//   Box,
//   Container,
//   HStack,
//   Link as ChakraLink,
//   Text,
//   Icon,
// } from "@chakra-ui/react";
// import { FiMail } from "react-icons/fi";
// import NextLink from "next/link";

// export default function Footer({}: {
// }) {
//   return (
//     <Box
//       as="footer"
//       mt={8}
//       py={4}
//       borderTop="1px solid"
//       borderColor="gray.200"
//     >
//       <Container maxW="container.lg">
//         <HStack justify="space-between" wrap="wrap">
//           <HStack gap={4}>
//             <ChakraLink
//               as={NextLink}
//               href="/contact"
//               display="flex"
//               alignItems="center"
//             >
//               <Icon as={FiMail} mr={1} />
//               Contact Us
//             </ChakraLink>

//             <ChakraLink as={NextLink} href="/privacy">
//               Privacy Policy
//             </ChakraLink>

//             <ChakraLink as={NextLink} href="/accessibility">
//               Accessibility
//             </ChakraLink>
//           </HStack>

//           <Text fontSize="sm" color="gray.500">
//             © {new Date().getFullYear()} Mindful Brilliance
//           </Text>
//         </HStack>
//       </Container>
//     </Box>
//   );
// }
