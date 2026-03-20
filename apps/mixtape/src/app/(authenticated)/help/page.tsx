import { Box, Container, Heading, Stack, Text } from "@chakra-ui/react";
import { listHelpDocs } from "@/lib/help/helpDocs";
import { HelpAdminLinks } from "@/components/help/HelpAdminLinks";
import { HelpIndexClient } from "@/components/help/HelpIndexClient";

export const metadata = {
  title: "Help",
  description: "User-facing help articles for Mixtape features.",
};

export default async function HelpIndexPage() {
  const docs = await listHelpDocs();

  return (
    <Box as="main" py={{ base: 8, md: 10 }}>
      <Container maxW="6xl" px={{ base: 4, md: 6 }}>
        <Stack gap={8}>
          <Stack gap={3}>
            <Heading as="h1" size="2xl">
              Help
            </Heading>
            <Text fontSize="md" color="fg.muted" maxW="3xl">
              Search user guides for the parts of Mixtape you’re working in now.
              This surface currently indexes the end-user help files in the shared help library.
            </Text>
            <HelpAdminLinks />
          </Stack>

          <HelpIndexClient docs={docs} />
        </Stack>
      </Container>
    </Box>
  );
}
